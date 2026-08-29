import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, Text } from 'react-native';
import { Button, ErrorBanner, Field, Screen } from '@/src/components/ui';
import { useMoney } from '@/src/hooks/useMoney';
import { saveEnvelope } from '@/src/services/mutations';
import { useBudgetStore } from '@/src/store/budget';

export default function EnvelopeFormScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { toBase, fromBase } = useMoney();
  const envelopes = useBudgetStore((state) => state.envelopes);
  const existing = useMemo(
    () => envelopes.find((item) => item.clientId === id),
    [envelopes, id],
  );
  const [name, setName] = useState(existing?.name ?? '');
  const [amount, setAmount] = useState(existing ? String(fromBase(existing.allocatedAmount)) : '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    const parsed = Number(amount);
    if (!name.trim()) return setError('Name is required');
    if (!Number.isFinite(parsed) || parsed <= 0) return setError('Allocated amount must be greater than 0');
    const base = toBase(parsed);
    if (existing && base < existing.consumed) {
      return setError('Allocated amount cannot be lower than what is already spent.');
    }
    setSaving(true);
    setError('');
    try {
      await saveEnvelope({ clientId: existing?.clientId, name: name.trim(), allocatedAmount: base });
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save envelope');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <ScrollView>
        <Text className="mb-4 text-lg font-semibold text-white">
          {existing ? 'Edit expense envelope' : 'New expense envelope'}
        </Text>
        <ErrorBanner message={error} />
        <Field label="Name" value={name} onChangeText={setName} />
        <Field label="Allocated amount" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
        <Button title={saving ? 'Saving...' : 'Save'} loading={saving} onPress={onSave} />
      </ScrollView>
    </Screen>
  );
}
