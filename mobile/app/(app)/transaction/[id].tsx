import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, ScrollView, Text, View } from 'react-native';
import { Button, Card, EmptyState, Screen } from '@/src/components/ui';
import { useMoney } from '@/src/hooks/useMoney';
import { removeTransaction } from '@/src/services/mutations';
import { useBudgetStore } from '@/src/store/budget';
import { formatDisplayDate } from '@/src/utils/dates';
import { effectiveTaxAmount } from '@/src/utils/tax';

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { format } = useMoney();
  const tx = useBudgetStore((state) => state.transactions.find((item) => item.clientId === id));

  if (!tx) {
    return (
      <Screen>
        <EmptyState icon="alert-circle-outline" title="Not found" body="This transaction is no longer on this device." />
      </Screen>
    );
  }

  const isFill = tx.type === 'income' && !tx.envelopeClientId;

  const onDelete = () => {
    Alert.alert('Delete transaction', 'This will be removed and synced when you are online.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await removeTransaction(tx.clientId);
          router.back();
        },
      },
    ]);
  };

  return (
    <Screen>
      <ScrollView contentContainerClassName="pb-10">
        <Text className="text-2xl font-bold text-white">{tx.title}</Text>
        <Text className={`mt-2 text-xl ${tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
          {tx.type === 'income' ? '+' : '-'}
          {format(tx.amount)}
        </Text>
        <Card className="mt-4">
          <Text className="text-sm text-slate-400">Date</Text>
          <Text className="mb-3 text-white">{formatDisplayDate(tx.date)}</Text>
          <Text className="text-sm text-slate-400">Type</Text>
          <Text className="mb-3 text-white">{isFill ? 'Fill account' : tx.type}</Text>
          <Text className="text-sm text-slate-400">Payment method</Text>
          <Text className="mb-3 text-white">{tx.paymentMethod}</Text>
          {tx.envelopeName ? (
            <>
              <Text className="text-sm text-slate-400">Envelope</Text>
              <Text className="mb-3 text-white">{tx.envelopeName}</Text>
            </>
          ) : null}
          {tx.incomeName ? (
            <>
              <Text className="text-sm text-slate-400">Income source</Text>
              <Text className="mb-3 text-white">{tx.incomeName}</Text>
            </>
          ) : null}
          {tx.purpose ? (
            <>
              <Text className="text-sm text-slate-400">Purpose</Text>
              <Text className="mb-3 text-white">{tx.purpose}</Text>
            </>
          ) : null}
          {tx.type === 'expense' ? (
            <>
              <Text className="text-sm text-slate-400">Tax</Text>
              <Text className="text-white">
                {format(effectiveTaxAmount(tx))}
                {tx.taxPercentage ? ` (${tx.taxPercentage}%)` : ''}
                {tx.taxApplication ? ` · ${tx.taxApplication}` : ''}
              </Text>
            </>
          ) : null}
        </Card>

        {tx.updateLogs.length > 0 && (
          <Card className="mt-4">
            <Text className="mb-2 font-medium text-white">Update history</Text>
            {tx.updateLogs.map((log, index) => (
              <Text key={`${log.timestamp}-${index}`} className="mb-1 text-sm text-slate-400">
                {formatDisplayDate(log.timestamp)} · {log.reason} ({log.before} → {log.after})
              </Text>
            ))}
          </Card>
        )}

        <View className="mt-5 gap-3">
          <Button
            title="Edit"
            onPress={() =>
              router.push(
                isFill
                  ? { pathname: '/(app)/transaction/fill', params: { id: tx.clientId } }
                  : { pathname: '/(app)/transaction/form', params: { id: tx.clientId } },
              )
            }
          />
          <Button title="Delete" variant="danger" onPress={onDelete} />
        </View>
      </ScrollView>
    </Screen>
  );
}
