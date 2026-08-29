import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { Button, Card, EmptyState, Screen } from '@/src/components/ui';
import { useMoney } from '@/src/hooks/useMoney';
import { removeEnvelope } from '@/src/services/mutations';
import { useBudgetStore } from '@/src/store/budget';
import { usePreferences } from '@/src/store/preferences';
import { formatDisplayDate } from '@/src/utils/dates';
import { inPeriod } from '@/src/utils/period';

export default function EnvelopeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { format } = useMoney();
  const period = usePreferences((state) => state.period);
  const env = useBudgetStore((state) => state.envelopes.find((item) => item.clientId === id));
  const txs = useBudgetStore((state) =>
    state.transactions.filter((tx) => tx.envelopeClientId === id && inPeriod(tx.date, period)),
  );

  if (!env) {
    return (
      <Screen>
        <EmptyState icon="alert-circle-outline" title="Not found" body="This envelope is no longer on this device." />
      </Screen>
    );
  }

  const onDelete = () => {
    Alert.alert('Delete envelope', 'This envelope will be removed and synced later.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await removeEnvelope(env.clientId);
          router.back();
        },
      },
    ]);
  };

  return (
    <Screen>
      <ScrollView contentContainerClassName="pb-10">
        <Text className="text-2xl font-bold text-white">{env.name}</Text>
        <Card className="mt-4">
          <Text className="text-sm text-slate-400">Allocated</Text>
          <Text className="mb-3 text-white">{format(env.allocatedAmount)}</Text>
          <Text className="text-sm text-slate-400">Spent</Text>
          <Text className="mb-3 text-rose-400">{format(env.consumed)}</Text>
          <Text className="text-sm text-slate-400">Remaining</Text>
          <Text className="text-emerald-400">{format(env.currentBalance)}</Text>
        </Card>

        <View className="mt-4 gap-3">
          <Button
            title="Edit"
            onPress={() => router.push({ pathname: '/(app)/envelope/form', params: { id: env.clientId } })}
          />
          <Button title="Delete" variant="danger" onPress={onDelete} />
        </View>

        <Text className="mb-3 mt-6 text-base font-semibold text-white">Transactions this period</Text>
        {txs.length === 0 ? (
          <Text className="text-sm text-slate-500">No linked transactions in the selected period.</Text>
        ) : (
          txs.map((tx) => (
            <Pressable
              key={tx.clientId}
              onPress={() => router.push(`/(app)/transaction/${tx.clientId}`)}
              className="mb-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-3"
            >
              <View className="flex-row justify-between">
                <Text className="text-white">{tx.title}</Text>
                <Text className={tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}>
                  {format(tx.amount)}
                </Text>
              </View>
              <Text className="mt-1 text-xs text-slate-500">{formatDisplayDate(tx.date)}</Text>
            </Pressable>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}
