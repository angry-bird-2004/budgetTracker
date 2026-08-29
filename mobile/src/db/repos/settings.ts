import { getDb } from '../client';
import { settings } from '../schema';
import type { Settings } from '../../types';

const DEFAULT_PAGE_SIZE = 50;

export const getSettings = async (): Promise<Settings> => {
  const row = await getDb().select().from(settings).get();
  return {
    transactionPageSize: row?.transactionPageSize ?? DEFAULT_PAGE_SIZE,
  };
};

export const upsertSettings = async (next: Settings) => {
  const db = getDb();
  const existing = await db.select().from(settings).get();
  if (existing) {
    await db.update(settings).set({ transactionPageSize: next.transactionPageSize });
    return;
  }
  await db.insert(settings).values({ transactionPageSize: next.transactionPageSize });
};
