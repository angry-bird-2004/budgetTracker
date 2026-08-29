import { and, eq } from 'drizzle-orm';
import { getDb } from '../client';
import { idMap } from '../schema';
import type { OutboxEntity } from '../../types';

export const rememberServerId = async (
  entity: OutboxEntity,
  clientId: string,
  serverId: string,
) => {
  const db = getDb();
  await db.delete(idMap).where(and(eq(idMap.entity, entity), eq(idMap.clientId, clientId)));
  await db.insert(idMap).values({ entity, clientId, serverId });
};

export const getServerId = async (entity: OutboxEntity, clientId: string) => {
  const row = getDb()
    .select()
    .from(idMap)
    .where(and(eq(idMap.entity, entity), eq(idMap.clientId, clientId)))
    .get();
  if (row?.serverId) return row.serverId;

  if (entity === 'envelope') {
    const { getEnvelopeByClientId } = await import('./envelopes');
    return (await getEnvelopeByClientId(clientId))?.serverId ?? null;
  }
  if (entity === 'incomeEnvelope') {
    const { getIncomeEnvelopeByClientId } = await import('./incomeEnvelopes');
    return (await getIncomeEnvelopeByClientId(clientId))?.serverId ?? null;
  }
  if (entity === 'transaction') {
    const { getTransactionByClientId } = await import('./transactions');
    return (await getTransactionByClientId(clientId))?.serverId ?? null;
  }
  return null;
};

export const getClientIdByServerId = async (entity: OutboxEntity, serverId: string) => {
  const row = await getDb()
    .select()
    .from(idMap)
    .where(and(eq(idMap.entity, entity), eq(idMap.serverId, serverId)))
    .get();
  return row?.clientId ?? null;
};
