import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SyncBanner } from '@/src/components/SyncBanner';
import { Chip, ChipRow, EmptyState, Field, Screen, Title } from '@/src/components/ui';
import { useMoney } from '@/src/hooks/useMoney';
import { useBudgetStore } from '@/src/store/budget';
import { usePreferences } from '@/src/store/preferences';
import { formatDisplayDate } from '@/src/utils/dates';
import { inPeriod } from '@/src/utils/period';

export default function TransactionsScreen() {
  const router = useRouter();
  const { format } = useMoney();
  const period = usePreferences((state) => state.period);
  const transactions = useBudgetStore((state) => state.transactions);
  const pageSize = useBudgetStore((state) => state.settings.transactionPageSize);
  const [search, setSearch] = useState('');
  const [type, setType] = useState<'all' | 'income' | 'expense'>('all');
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return transactions
      .filter((tx) => inPeriod(tx.date, period))
      .filter((tx) => (type === 'all' ? true : tx.type === type))
      .filter((tx) => {
        if (!q) return true;
        return [tx.title, tx.purpose, tx.paymentMethod].some((value) =>
          String(value || '').toLowerCase().includes(q),
        );
      })
      .sort((a, b) => {
        const diff = +new Date(a.date) - +new Date(b.date);
        return sort === 'oldest' ? diff : -diff;
      });
  }, [transactions, period, search, type, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pages);
  const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-8">
        <Title>History</Title>
        <View className="mt-4">
          <SyncBanner />
        </View>
        <Field label="Search" value={search} onChangeText={(value) => { setSearch(value); setPage(1); }} placeholder="Title, purpose, method" />
        <ChipRow>
          {(['all', 'income', 'expense'] as const).map((item) => (
            <Chip key={item} label={item} active={type === item} onPress={() => { setType(item); setPage(1); }} />
          ))}
          <Chip label="Newest" active={sort === 'newest'} onPress={() => setSort('newest')} />
          <Chip label="Oldest" active={sort === 'oldest'} onPress={() => setSort('oldest')} />
        </ChipRow>

        {visible.length === 0 ? (
          <EmptyState icon="receipt-outline" title="No transactions" body="Add a transaction or fill an account to see it here." />
        ) : (
          visible.map((tx) => (
            <Pressable
              key={tx.clientId}
              onPress={() => router.push(`/(app)/transaction/${tx.clientId}`)}
              className="mb-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-3"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-1 pr-3">
                  <Text className="font-medium text-white">{tx.title}</Text>
                  <Text className="mt-1 text-xs text-slate-500">
                    {formatDisplayDate(tx.date)} · {tx.paymentMethod}
                    {tx.envelopeName ? ` · ${tx.envelopeName}` : ''}
                  </Text>
                </View>
                <Text className={tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}>
                  {tx.type === 'income' ? '+' : '-'}
                  {format(tx.amount)}
                </Text>
              </View>
            </Pressable>
          ))
        )}

        {pages > 1 && (
          <View className="mt-4 flex-row items-center justify-between">
            <Chip label="Previous" active={false} onPress={() => setPage((value) => Math.max(1, value - 1))} />
            <Text className="text-sm text-slate-400">
              Page {currentPage} of {pages}
            </Text>
            <Chip label="Next" active={false} onPress={() => setPage((value) => Math.min(pages, value + 1))} />
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
