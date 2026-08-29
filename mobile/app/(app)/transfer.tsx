import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, Text } from 'react-native';
import { Button, Chip, ErrorBanner, Field, Screen, SelectList } from '@/src/components/ui';
import { useMoney } from '@/src/hooks/useMoney';
import { transferLocal } from '@/src/services/mutations';
import { useBudgetStore } from '@/src/store/budget';

export default function TransferScreen() {
  const router = useRouter();
  const { format, toBase, fromBase } = useMoney();
  const envelopes = useBudgetStore((state) => state.envelopes);
  const incomeEnvelopes = useBudgetStore((state) => state.incomeEnvelopes);
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const list = type === 'expense' ? envelopes : incomeEnvelopes;
  const [fromClientId, setFromClientId] = useState(list[0]?.clientId ?? '');
  const [toClientId, setToClientId] = useState(list[1]?.clientId ?? '');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const source = useMemo(
    () => list.find((item) => item.clientId === fromClientId),
    [list, fromClientId],
  );

  const onTypeChange = (next: 'expense' | 'income') => {
    setType(next);
    const nextList = next === 'expense' ? envelopes : incomeEnvelopes;
    setFromClientId(nextList[0]?.clientId ?? '');
    setToClientId(nextList[1]?.clientId ?? '');
  };

  const onSave = async () => {
    const parsed = Number(amount);
    if (!fromClientId || !toClientId) return setError('Choose source and destination envelopes');
    if (fromClientId === toClientId) return setError('Source and destination cannot be the same');
    if (!Number.isFinite(parsed) || parsed <= 0) return setError('Amount must be greater than 0');
    const base = toBase(parsed);
    if (source && base > source.currentBalance) {
      return setError('Transfer exceeds remaining funds in the source envelope');
    }

    setSaving(true);
    setError('');
    try {
      await transferLocal({ type, fromClientId, toClientId, amount: base });
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transfer failed');
    } finally {
      setSaving(false);
    }
  };

  const options = list.map((env) => ({
    label: `${env.name} (${format(env.currentBalance)})`,
    value: env.clientId,
  }));

  return (
    <Screen>
      <ScrollView contentContainerClassName="pb-10">
        <Text className="mb-4 text-lg font-semibold text-white">Transfer funds</Text>
        <ErrorBanner message={error} />
        <SelectList
          label="Envelope type"
          value={type}
          onChange={(value) => onTypeChange(value as 'expense' | 'income')}
          options={[
            { label: 'Expense', value: 'expense' },
            { label: 'Income', value: 'income' },
          ]}
        />
        <SelectList label="From" value={fromClientId} onChange={setFromClientId} options={options} />
        <SelectList label="To" value={toClientId} onChange={setToClientId} options={options} />
        <Field label="Amount" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
        {source ? (
          <Chip
            label={`Transfer all (${format(source.currentBalance)})`}
            onPress={() => setAmount(String(fromBase(source.currentBalance)))}
          />
        ) : null}
        <Button title={saving ? 'Transferring...' : 'Transfer'} loading={saving} onPress={onSave} />
      </ScrollView>
    </Screen>
  );
}
