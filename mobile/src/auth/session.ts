import * as SecureStore from 'expo-secure-store';
import type { Session } from '../types';

const SESSION_KEY = 'budgetTrackerSession';

export const readSession = async (): Promise<Session | null> => {
  try {
    const raw = await SecureStore.getItemAsync(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Session;
    if (!parsed?.accessToken || !parsed?.user?._id) return null;
    return parsed;
  } catch {
    await SecureStore.deleteItemAsync(SESSION_KEY).catch(() => undefined);
    return null;
  }
};

export const writeSession = async (session: Session) => {
  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
};

export const clearSession = async () => {
  await SecureStore.deleteItemAsync(SESSION_KEY);
};
