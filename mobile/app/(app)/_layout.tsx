import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { SyncProvider } from '@/src/sync/SyncProvider';
import { useBudgetStore } from '@/src/store/budget';
import { usePreferences } from '@/src/store/preferences';
import { initDatabase } from '@/src/db/client';
import { runSync } from '@/src/sync/engine';

export default function AppLayout() {
  const load = useBudgetStore((state) => state.load);
  const hydrate = usePreferences((state) => state.hydrate);

  useEffect(() => {
    (async () => {
      try {
        await initDatabase();
        await hydrate();
        await load();
        runSync('full').then(() => load()).catch(() => undefined);
      } catch (error) {
        console.warn('Failed to start local database', error);
      }
    })();
  }, [hydrate, load]);

  return (
    <SyncProvider>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#020617' },
          headerTintColor: '#e2e8f0',
          headerShadowVisible: false,
          contentStyle: { backgroundColor: '#020617' },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="transaction/form" options={{ title: 'Transaction' }} />
        <Stack.Screen name="transaction/fill" options={{ title: 'Fill Account' }} />
        <Stack.Screen name="transaction/[id]" options={{ title: 'Transaction' }} />
        <Stack.Screen name="envelope/form" options={{ title: 'Expense Envelope' }} />
        <Stack.Screen name="envelope/[id]" options={{ title: 'Envelope' }} />
        <Stack.Screen name="income-envelope/form" options={{ title: 'Income Envelope' }} />
        <Stack.Screen name="income-envelope/[id]" options={{ title: 'Income Envelope' }} />
        <Stack.Screen name="transfer" options={{ title: 'Transfer Funds' }} />
      </Stack>
    </SyncProvider>
  );
}
