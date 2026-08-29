import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, ScrollView, Text } from 'react-native';
import { Button, ErrorBanner, Field, Screen, SelectList } from '@/src/components/ui';
import { useMoney } from '@/src/hooks/useMoney';
import { saveTransaction } from '@/src/services/mutations';
import { useBudgetStore } from '@/src/store/budget';
import { usePreferences } from '@/src/store/preferences';
import { toIsoDate, toLocalDateInput } from '@/src/utils/dates';
import { buildTransactionAmount } from '@/src/utils/tax';
import type { TaxApplication } from '@/src/types';

export default function TransactionFormScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { toBase, fromBase } = useMoney();
  const envelopes = useBudgetStore((state) => state.envelopes);
  const incomeEnvelopes = useBudgetStore((state) => state.incomeEnvelopes);
  const transactions = useBudgetStore((state) => state.transactions);
  const linkedIncomeClientId = usePreferences((state) => state.linkedIncomeClientId);
  const existing = useMemo(
    () => transactions.find((tx) => tx.clientId === id),
    [transactions, id],
  );

  const [title, setTitle] = useState(existing?.title ?? '');
  const [amount, setAmount] = useState(existing ? String(fromBase(existing.amount)) : '');
  const [type, setType] = useState<'expense' | 'income'>(existing?.type === 'income' ? 'income' : 'expense');
  const [envelopeClientId, setEnvelopeClientId] = useState(existing?.envelopeClientId ?? envelopes[0]?.clientId ?? '');
  const [incomeClientId, setIncomeClientId] = useState(
    existing?.incomeClientId ?? linkedIncomeClientId ?? incomeEnvelopes[0]?.clientId ?? '',
  );
  const [paymentMethod, setPaymentMethod] = useState(existing?.paymentMethod ?? 'cash');
  const [purpose, setPurpose] = useState(existing?.purpose ?? '');
  const [date, setDate] = useState(toLocalDateInput(existing?.date) || toLocalDateInput(new Date()));
  const [taxPercentage, setTaxPercentage] = useState(existing?.taxPercentage ? String(existing.taxPercentage) : '');
  const [taxAmount, setTaxAmount] = useState(existing?.taxAmount ? String(fromBase(existing.taxAmount)) : '');
  const [taxApplication, setTaxApplication] = useState<TaxApplication>(existing?.taxApplication ?? 'exclusive');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    const parsed = Number(amount);
    if (!title.trim()) return setError('Title is required');
    if (!Number.isFinite(parsed) || parsed <= 0) return setError('Amount must be greater than 0');
    if (!envelopeClientId) return setError('Budget envelope is required');
    if (!incomeClientId) return setError('Income envelope is required');

    const built = buildTransactionAmount({
      baseAmount: toBase(parsed),
      taxAmountInput: taxAmount ? toBase(Number(taxAmount)) : undefined,
      taxPercentageInput: taxPercentage ? Number(taxPercentage) : undefined,
      taxApplication,
      isExpense: type === 'expense',
    });

    setSaving(true);
    setError('');
    try {
      await saveTransaction({
        clientId: existing?.clientId,
        title: title.trim(),
        amount: built.finalAmount,
        type,
        envelopeClientId,
        incomeClientId,
        paymentMethod,
        purpose: purpose.trim(),
        taxPercentage: type === 'expense' ? built.taxPercentage || null : null,
        taxAmount: type === 'expense' ? built.taxAmount || null : null,
        taxApplication: type === 'expense' ? taxApplication : null,
        date: toIsoDate(date),
      });
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save transaction');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-10">
        <Text className="mb-4 text-lg font-semibold text-white">
          {existing ? 'Edit transaction' : 'New transaction'}
        </Text>
        <ErrorBanner message={error} />
        <SelectList
          label="Type"
          value={type}
          onChange={(value) => setType(value as 'expense' | 'income')}
          options={[
            { label: 'Expense', value: 'expense' },
            { label: 'Income', value: 'income' },
          ]}
        />
        <Field label="Title" value={title} onChangeText={setTitle} />
        <Field label="Amount" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
        <SelectList
          label="Budget envelope"
          value={envelopeClientId}
          onChange={setEnvelopeClientId}
          options={envelopes.map((env) => ({ label: env.name, value: env.clientId }))}
        />
        <SelectList
          label={type === 'expense' ? 'Pay from' : 'Credit to'}
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
        {type === 'expense' && (
          <>
            <Field label="Tax %" value={taxPercentage} onChangeText={setTaxPercentage} keyboardType="decimal-pad" />
            <Field label="Fixed tax" value={taxAmount} onChangeText={setTaxAmount} keyboardType="decimal-pad" />
            <SelectList
              label="Tax application"
              value={taxApplication}
              onChange={(value) => setTaxApplication(value as TaxApplication)}
              options={[
                { label: 'Exclusive', value: 'exclusive' },
                { label: 'Inclusive', value: 'inclusive' },
              ]}
            />
          </>
        )}
        <Button
          title={saving ? 'Saving...' : 'Save'}
          loading={saving}
          onPress={() => {
            if (envelopes.length === 0 || incomeEnvelopes.length === 0) {
              Alert.alert('Missing envelopes', 'Create expense and income envelopes first.');
              return;
            }
            onSave();
          }}
        />
      </ScrollView>
    </Screen>
  );
}
