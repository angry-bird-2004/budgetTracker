import NetInfo from '@react-native-community/netinfo';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';
import { countOutbox } from '../db/repos/outbox';
import { getLastServerTime } from '../db/repos/syncState';
import { useBudgetStore } from '../store/budget';
import type { SyncStatus } from '../types';
import { getSyncSnapshot, isOnline, runSync, subscribeSync } from './engine';

const SyncContext = createContext<SyncStatus & { refresh: () => Promise<void> }>({
  online: true,
  syncing: false,
  pending: 0,
  lastError: null,
  lastSyncedAt: null,
  refresh: async () => undefined,
});

export const SyncProvider = ({ children }: { children: React.ReactNode }) => {
  const [status, setStatus] = useState<SyncStatus>({
    online: true,
    syncing: false,
    pending: 0,
    lastError: null,
    lastSyncedAt: null,
  });
  const load = useBudgetStore((state) => state.load);

  const refreshSnapshot = async () => {
    const snapshot = await getSyncSnapshot();
    setStatus((current) => ({
      ...current,
      ...snapshot,
    }));
  };

  const refresh = async () => {
    try {
      await runSync();
      await load();
      setStatus({
        ...(await getSyncSnapshot()),
        lastError: null,
      });
    } catch (error) {
      setStatus({
        online: await isOnline(),
        syncing: false,
        pending: await countOutbox(),
        lastSyncedAt: await getLastServerTime(),
        lastError: error instanceof Error ? error.message : 'Sync failed',
      });
    }
  };

  useEffect(() => {
    const unsubscribeNet = NetInfo.addEventListener((state) => {
      const online = Boolean(state.isConnected && state.isInternetReachable !== false);
      setStatus((current) => ({ ...current, online }));
      if (online) refresh();
    });

    const appSub = AppState.addEventListener('change', (next) => {
      if (next === 'active') refresh();
    });

    const unsubscribeSync = subscribeSync(() => {
      refreshSnapshot();
      load();
    });

    refresh();

    return () => {
      unsubscribeNet();
      appSub.remove();
      unsubscribeSync();
    };
  }, [load]);

  const value = useMemo(() => ({ ...status, refresh }), [status, refresh]);

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
};

export const useSyncStatus = () => useContext(SyncContext);
