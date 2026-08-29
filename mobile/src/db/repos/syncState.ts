import { getDb } from '../client';
import { syncState } from '../schema';

export const getLastServerTime = async () => {
  const row = await getDb().select().from(syncState).get();
  return row?.lastServerTime ?? null;
};

export const setLastServerTime = async (serverTime: string) => {
  const db = getDb();
  const existing = await db.select().from(syncState).get();
  if (existing) {
    await db.update(syncState).set({ lastServerTime: serverTime });
    return;
  }
  await db.insert(syncState).values({ lastServerTime: serverTime });
};
