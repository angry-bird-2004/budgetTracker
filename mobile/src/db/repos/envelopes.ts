import { eq } from 'drizzle-orm';
import { getDb } from '../client';
import { envelopes } from '../schema';
import { rememberServerId } from './idMap';

export type EnvelopeRow = {
  clientId: string;
  serverId: string | null;
  name: string;
  allocatedAmount: number;
  isSystem: boolean;
  createdAt: string | null;
  updatedAt: string | null;
};

export const listEnvelopeRows = async (): Promise<EnvelopeRow[]> =>
  getDb().select().from(envelopes);

export const getEnvelopeByClientId = async (clientId: string) =>
  getDb().select().from(envelopes).where(eq(envelopes.clientId, clientId)).get();

export const getEnvelopeByServerId = async (serverId: string) =>
  getDb().select().from(envelopes).where(eq(envelopes.serverId, serverId)).get();

export const upsertEnvelope = async (row: EnvelopeRow) => {
  const db = getDb();
  const existing = row.serverId
    ? await getEnvelopeByServerId(row.serverId)
    : await getEnvelopeByClientId(row.clientId);
  const clientId = existing?.clientId ?? row.clientId;
  const next = { ...row, clientId };

  if (existing) {
    await db.update(envelopes).set(next).where(eq(envelopes.clientId, existing.clientId));
  } else {
    await db.insert(envelopes).values(next);
  }

  if (next.serverId) {
    await rememberServerId('envelope', clientId, next.serverId);
  }
  return clientId;
};

export const deleteEnvelopeLocal = async (clientId: string) => {
  await getDb().delete(envelopes).where(eq(envelopes.clientId, clientId));
};

export const deleteEnvelopeByServerId = async (serverId: string) => {
  await getDb().delete(envelopes).where(eq(envelopes.serverId, serverId));
};
