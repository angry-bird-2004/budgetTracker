import NetInfo from '@react-native-community/netinfo';
import { pullSync } from '../api/endpoints';
import { initDatabase } from '../db/client';
import { countOutbox } from '../db/repos/outbox';
import { getLastServerTime, setLastServerTime } from '../db/repos/syncState';
import { flushOutbox } from './flush';
import { mergeSyncPayload } from './merge';

export type SyncListener = () => void;

let syncing = false;
const listeners = new Set<SyncListener>();

export const subscribeSync = (listener: SyncListener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const notify = () => {
  listeners.forEach((listener) => listener());
};

export const isOnline = async () => {
  const state = await NetInfo.fetch();
  return Boolean(state.isConnected && state.isInternetReachable !== false);
};

export const runSync = async (mode: 'full' | 'incremental' = 'incremental') => {
  await initDatabase();
  if (syncing) return;
  if (!(await isOnline())) {
    notify();
    return;
  }

  syncing = true;
  notify();
  try {
    await flushOutbox();
    const since = mode === 'full' ? null : await getLastServerTime();
    const { data } = await pullSync(since);
    await mergeSyncPayload(data);
    await setLastServerTime(data.serverTime);
  } finally {
    syncing = false;
    notify();
  }
};

export const getSyncSnapshot = async () => {
  try {
    return {
      syncing,
      pending: await countOutbox(),
      lastSyncedAt: await getLastServerTime(),
      online: await isOnline(),
    };
  } catch {
    return {
      syncing,
      pending: 0,
      lastSyncedAt: null,
      online: await isOnline().catch(() => false),
    };
  }
};
