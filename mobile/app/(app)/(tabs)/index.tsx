import { useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SyncBanner } from '@/src/components/SyncBanner';
import { Button, Card, Chip, ChipRow, Screen, Title } from '@/src/components/ui';
import { useMoney } from '@/src/hooks/useMoney';
import { useAuth } from '@/src/auth/AuthProvider';
import { useBudgetStore } from '@/src/store/budget';
import { usePreferences } from '@/src/store/preferences';
import { effectiveTaxAmount } from '@/src/utils/tax';
import { inPeriod, PERIOD_OPTIONS } from '@/src/utils/period';
import { formatDisplayDate } from '@/src/utils/dates';

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { format } = useMoney();
  const period = usePreferences((state) => state.period);
  const setPeriod = usePreferences((state) => state.setPeriod);
  const currency = usePreferences((state) => state.currency);
  const setCurrency = usePreferences((state) => state.setCurrency);
  const conversionRate = usePreferences((state) => state.conversionRate);
  const linkedIncomeClientId = usePreferences((state) => state.linkedIncomeClientId);
  const setLinkedIncomeClientId = usePreferences((state) => state.setLinkedIncomeClientId);
  const envelopes = useBudgetStore((state) => state.envelopes);
  const incomeEnvelopes = useBudgetStore((state) => state.incomeEnvelopes);
  const transactions = useBudgetStore((state) => state.transactions);

  const filtered = transactions.filter((tx) => inPeriod(tx.date, period));
  const scoped = linkedIncomeClientId
    ? filtered.filter((tx) => tx.incomeClientId === linkedIncomeClientId)
    : filtered;

  const income = scoped.filter((tx) => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0);
  const expense = scoped.filter((tx) => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0);
  const tax = scoped.filter((tx) => tx.type === 'expense').reduce((sum, tx) => sum + effectiveTaxAmount(tx), 0);
  const recent = [...filtered].sort((a, b) => +new Date(b.date) - +new Date(a.date)).slice(0, 5);

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-8">
        <Title>Dashboard</Title>
        <Text className="mt-1 text-sm text-slate-400">Welcome, {user?.username}</Text>
        <View className="mt-4">
          <SyncBanner />
        </View>

        <ChipRow>
          {PERIOD_OPTIONS.map((option) => (
            <Chip
              key={option.key}
              label={option.label}
              active={period === option.key}
              onPress={() => setPeriod(option.key)}
            />
          ))}
        </ChipRow>

        <View className="mb-4 flex-row items-center justify-between">
          <View className="flex-row">
            <Chip label="PKR" active={currency === 'PKR'} onPress={() => setCurrency('PKR')} />
            <Chip label="USD" active={currency === 'USD'} onPress={() => setCurrency('USD')} />
          </View>
          <Text className="text-xs text-slate-500">1 USD = {conversionRate.toFixed(2)} PKR</Text>
        </View>

        <Card className="mb-4">
          <Text className="mb-2 text-sm text-slate-400">Pay from / credit to</Text>
          <ChipRow>
            <Chip label="All totals" active={!linkedIncomeClientId} onPress={() => setLinkedIncomeClientId('')} />
            {incomeEnvelopes.map((env) => (
              <Chip
                key={env.clientId}
                label={`${env.name} (${format(env.currentBalance)})`}
                active={linkedIncomeClientId === env.clientId}
                onPress={() => setLinkedIncomeClientId(env.clientId)}
              />
            ))}
          </ChipRow>
        </Card>

        <View className="mb-4 flex-row flex-wrap justify-between">
          {[
            { label: 'Income', value: income, color: 'text-emerald-400' },
            { label: 'Expenses', value: expense, color: 'text-rose-400' },
            { label: 'Tax', value: tax, color: 'text-amber-400' },
            { label: 'Net', value: income - expense, color: 'text-indigo-300' },
          ].map((card) => (
            <Card key={card.label} className="mb-3 w-[48%]">
              <Text className="text-xs text-slate-400">{card.label}</Text>
              <Text className={`mt-2 text-lg font-semibold ${card.color}`}>{format(card.value)}</Text>
            </Card>
          ))}
        </View>

        <View className="mb-5 gap-3">
          <Button title="New Transaction" onPress={() => router.push('/(app)/transaction/form')} />
          <Button title="Fill Account" variant="ghost" onPress={() => router.push('/(app)/transaction/fill')} />
          <Button title="Transfer Funds" variant="ghost" onPress={() => router.push('/(app)/transfer')} />
        </View>

        <Text className="mb-3 text-base font-semibold text-white">Recent activity</Text>
        {recent.length === 0 ? (
          <Text className="text-sm text-slate-500">No transactions in this period.</Text>
        ) : (
          recent.map((tx) => (
            <Pressable
              key={tx.clientId}
              onPress={() => router.push(`/(app)/transaction/${tx.clientId}`)}
              className="mb-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-3"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-1 pr-3">
                  <Text className="font-medium text-white">{tx.title}</Text>
                  <Text className="mt-1 text-xs text-slate-500">{formatDisplayDate(tx.date)}</Text>
                </View>
                <Text className={tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}>
                  {tx.type === 'income' ? '+' : '-'}
                  {format(tx.amount)}
                </Text>
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}
