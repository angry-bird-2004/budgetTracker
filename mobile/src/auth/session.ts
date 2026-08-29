import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session } from '../types';

const SESSION_KEY = 'budgetTrackerSession';

export const readSession = async (): Promise<Session | null> => {
  try {
    const raw = await AsyncStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Session;
    if (!parsed?.accessToken || !parsed?.user?._id) return null;
    return parsed;
  } catch {
    await AsyncStorage.removeItem(SESSION_KEY).catch(() => undefined);
    return null;
  }
};

export const writeSession = async (session: Session) => {
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
};

export const clearSession = async () => {
  await AsyncStorage.removeItem(SESSION_KEY);
};
