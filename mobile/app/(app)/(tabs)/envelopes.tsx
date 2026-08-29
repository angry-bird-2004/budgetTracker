import { useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SyncBanner } from '@/src/components/SyncBanner';
import { Button, Card, EmptyState, Screen, Title } from '@/src/components/ui';
import { useMoney } from '@/src/hooks/useMoney';
import { useBudgetStore } from '@/src/store/budget';

export default function EnvelopesScreen() {
  const router = useRouter();
  const { format } = useMoney();
  const envelopes = useBudgetStore((state) => state.envelopes);
  const incomeEnvelopes = useBudgetStore((state) => state.incomeEnvelopes);

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-8">
        <Title>Envelopes</Title>
        <View className="mt-4">
          <SyncBanner />
        </View>

        <View className="mb-4 flex-row gap-3">
          <View className="flex-1">
            <Button title="New expense" onPress={() => router.push('/(app)/envelope/form')} />
          </View>
          <View className="flex-1">
            <Button title="New income" variant="ghost" onPress={() => router.push('/(app)/income-envelope/form')} />
          </View>
        </View>

        <Text className="mb-3 text-base font-semibold text-white">Expense envelopes</Text>
        {envelopes.length === 0 ? (
          <EmptyState icon="wallet-outline" title="No expense envelopes" body="Create a budget envelope to start tracking spending." />
        ) : (
          envelopes.map((env) => (
            <Pressable key={env.clientId} onPress={() => router.push(`/(app)/envelope/${env.clientId}`)}>
              <Card className="mb-3">
                <Text className="font-semibold text-white">{env.name}</Text>
                <Text className="mt-2 text-sm text-slate-400">
                  Remaining {format(env.currentBalance)} · Spent {format(env.consumed)}
                </Text>
                <Text className="mt-1 text-xs text-slate-500">Allocated {format(env.allocatedAmount)}</Text>
              </Card>
            </Pressable>
          ))
        )}

        <Text className="mb-3 mt-4 text-base font-semibold text-white">Income envelopes</Text>
        {incomeEnvelopes.length === 0 ? (
          <EmptyState icon="trending-up-outline" title="No income envelopes" body="Create an income source to fill and spend from." />
        ) : (
          incomeEnvelopes.map((env) => (
            <Pressable key={env.clientId} onPress={() => router.push(`/(app)/income-envelope/${env.clientId}`)}>
              <Card className="mb-3">
                <Text className="font-semibold text-white">{env.name}</Text>
                <Text className="mt-2 text-sm text-slate-400">
                  Balance {format(env.currentBalance)} · Out {format(env.consumed)}
                </Text>
                <Text className="mt-1 text-xs text-slate-500">
                  Allocated {format(env.allocatedAmount)} · Tax {format(env.tax)}
                </Text>
              </Card>
            </Pressable>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}
