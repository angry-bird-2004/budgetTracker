import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, Text } from 'react-native';
import { Button, ErrorBanner, Field, Screen, SelectList } from '@/src/components/ui';
import { useMoney } from '@/src/hooks/useMoney';
import { saveTransaction } from '@/src/services/mutations';
import { useBudgetStore } from '@/src/store/budget';
import { usePreferences } from '@/src/store/preferences';
import { toIsoDate, toLocalDateInput } from '@/src/utils/dates';

export default function FillAccountScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { toBase, fromBase } = useMoney();
  const incomeEnvelopes = useBudgetStore((state) => state.incomeEnvelopes);
  const transactions = useBudgetStore((state) => state.transactions);
  const linkedIncomeClientId = usePreferences((state) => state.linkedIncomeClientId);
  const existing = useMemo(
    () => transactions.find((tx) => tx.clientId === id),
    [transactions, id],
  );

  const [title, setTitle] = useState(existing?.title ?? '');
  const [amount, setAmount] = useState(existing ? String(fromBase(existing.amount)) : '');
  const [incomeClientId, setIncomeClientId] = useState(
    existing?.incomeClientId ?? linkedIncomeClientId ?? incomeEnvelopes[0]?.clientId ?? '',
  );
  const [paymentMethod, setPaymentMethod] = useState(existing?.paymentMethod ?? 'cash');
  const [purpose, setPurpose] = useState(existing?.purpose ?? '');
  const [date, setDate] = useState(toLocalDateInput(existing?.date) || toLocalDateInput(new Date()));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    const parsed = Number(amount);
    if (!title.trim()) return setError('Title is required');
    if (!Number.isFinite(parsed) || parsed <= 0) return setError('Amount must be greater than 0');
    if (!incomeClientId) return setError('Income envelope is required');

    setSaving(true);
    setError('');
    try {
      await saveTransaction({
        clientId: existing?.clientId,
        title: title.trim(),
        amount: toBase(parsed),
        type: 'income',
        envelopeClientId: null,
        incomeClientId,
        paymentMethod,
        purpose: purpose.trim(),
        date: toIsoDate(date),
      });
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fill account');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-10">
        <Text className="mb-4 text-lg font-semibold text-white">
          {existing ? 'Edit fill' : 'Fill account'}
        </Text>
        <ErrorBanner message={error} />
        <Field label="Title" value={title} onChangeText={setTitle} placeholder="Salary, bonus..." />
        <Field label="Amount" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
        <SelectList
          label="Income envelope"
          value={incomeClientId}
          onChange={setIncomeClientId}
          options={incomeEnvelopes.map((env) => ({ label: env.name, value: env.clientId }))}
        />
        <SelectList
          label="Payment method"
          value={paymentMethod}
          onChange={setPaymentMethod}
          options={[
            { label: 'Cash', value: 'cash' },
            { label: 'Card', value: 'card' },
            { label: 'Bank', value: 'bank' },
            { label: 'Other', value: 'other' },
          ]}
        />
        <Field label="Purpose / notes" value={purpose} onChangeText={setPurpose} />
        <Field label="Date (YYYY-MM-DD)" value={date} onChangeText={setDate} />
        <Button title={saving ? 'Saving...' : 'Save'} loading={saving} onPress={onSave} />
      </ScrollView>
    </Screen>
  );
}
