import { eq } from 'drizzle-orm';
import { getDb } from '../client';
import { transactions } from '../schema';
import { rememberServerId } from './idMap';
import type { TaxApplication, TransactionType, UpdateLog } from '../../types';

export type TransactionRow = {
  clientId: string;
  serverId: string | null;
  title: string;
  amount: number;
  type: TransactionType;
  envelopeClientId: string | null;
  incomeClientId: string | null;
  paymentMethod: string;
  purpose: string | null;
  taxPercentage: number | null;
  taxAmount: number | null;
  taxApplication: TaxApplication | null;
  date: string;
  updateLogs: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export const listTransactionRows = async (): Promise<TransactionRow[]> => {
  const rows = await getDb().select().from(transactions);
  return (Array.isArray(rows) ? rows : []) as TransactionRow[];
};

export const getTransactionByClientId = async (clientId: string) => {
  const row = getDb().select().from(transactions).where(eq(transactions.clientId, clientId)).get();
  return row as TransactionRow | undefined;
};

export const getTransactionByServerId = async (serverId: string) =>
  getDb().select().from(transactions).where(eq(transactions.serverId, serverId)).get();

export const upsertTransaction = async (row: TransactionRow) => {
  const db = getDb();
  const existing = row.serverId
    ? await getTransactionByServerId(row.serverId)
    : await getTransactionByClientId(row.clientId);
  const clientId = existing?.clientId ?? row.clientId;
  const next = { ...row, clientId };

  if (existing) {
    await db.update(transactions).set(next).where(eq(transactions.clientId, existing.clientId));
  } else {
    await db.insert(transactions).values(next);
  }

  if (next.serverId) {
    await rememberServerId('transaction', clientId, next.serverId);
  }
  return clientId;
};

export const deleteTransactionLocal = async (clientId: string) => {
  await getDb().delete(transactions).where(eq(transactions.clientId, clientId));
};

export const deleteTransactionByServerId = async (serverId: string) => {
  await getDb().delete(transactions).where(eq(transactions.serverId, serverId));
};

export const parseUpdateLogs = (raw: string | null): UpdateLog[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};
