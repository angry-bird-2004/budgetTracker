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
  const row = await getDb()
    .select()
    .from(idMap)
    .where(and(eq(idMap.entity, entity), eq(idMap.clientId, clientId)))
    .get();
  return row?.serverId ?? null;
};

export const getClientIdByServerId = async (entity: OutboxEntity, serverId: string) => {
  const row = await getDb()
    .select()
    .from(idMap)
    .where(and(eq(idMap.entity, entity), eq(idMap.serverId, serverId)))
    .get();
  return row?.clientId ?? null;
};
