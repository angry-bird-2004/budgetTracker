import { eq } from 'drizzle-orm';
import { getDb } from '../client';
import { incomeEnvelopes } from '../schema';
import { rememberServerId } from './idMap';

export type IncomeEnvelopeRow = {
  clientId: string;
  serverId: string | null;
  name: string;
  allocatedAmount: number;
  createdAt: string | null;
  updatedAt: string | null;
};

export const listIncomeEnvelopeRows = async (): Promise<IncomeEnvelopeRow[]> => {
  const rows = await getDb().select().from(incomeEnvelopes);
  return Array.isArray(rows) ? rows : [];
};

export const getIncomeEnvelopeByClientId = async (clientId: string) =>
  getDb().select().from(incomeEnvelopes).where(eq(incomeEnvelopes.clientId, clientId)).get();

export const getIncomeEnvelopeByServerId = async (serverId: string) =>
  getDb().select().from(incomeEnvelopes).where(eq(incomeEnvelopes.serverId, serverId)).get();

export const upsertIncomeEnvelope = async (row: IncomeEnvelopeRow) => {
  const db = getDb();
  const existing = row.serverId
    ? await getIncomeEnvelopeByServerId(row.serverId)
    : await getIncomeEnvelopeByClientId(row.clientId);
  const clientId = existing?.clientId ?? row.clientId;
  const next = { ...row, clientId };

  if (existing) {
    await db
      .update(incomeEnvelopes)
      .set(next)
      .where(eq(incomeEnvelopes.clientId, existing.clientId));
  } else {
    await db.insert(incomeEnvelopes).values(next);
  }

  if (next.serverId) {
    await rememberServerId('incomeEnvelope', clientId, next.serverId);
  }
  return clientId;
};

export const deleteIncomeEnvelopeLocal = async (clientId: string) => {
  await getDb().delete(incomeEnvelopes).where(eq(incomeEnvelopes.clientId, clientId));
};

export const deleteIncomeEnvelopeByServerId = async (serverId: string) => {
  await getDb().delete(incomeEnvelopes).where(eq(incomeEnvelopes.serverId, serverId));
};
