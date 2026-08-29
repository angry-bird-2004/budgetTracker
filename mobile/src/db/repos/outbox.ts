import { and, asc, eq, or } from 'drizzle-orm';
import { newClientId } from '../../utils/id';
import type { OutboxEntity, OutboxItem, OutboxOp } from '../../types';
import { getDb } from '../client';
import { outbox } from '../schema';

export const enqueueOutbox = async (
  entity: OutboxEntity,
  op: OutboxOp,
  clientId: string,
  payload: Record<string, unknown> = {},
) => {
  const db = getDb();

  if (op === 'delete') {
    const pendingCreates = await db
      .select()
      .from(outbox)
      .where(and(eq(outbox.entity, entity), eq(outbox.clientId, clientId), eq(outbox.op, 'create')));
    if (pendingCreates.length > 0) {
      await db
        .delete(outbox)
        .where(and(eq(outbox.entity, entity), eq(outbox.clientId, clientId)));
      return null;
    }
  }

  if (op === 'update') {
    const pendingCreate = await db
      .select()
      .from(outbox)
      .where(and(eq(outbox.entity, entity), eq(outbox.clientId, clientId), eq(outbox.op, 'create')))
      .get();
    if (pendingCreate) {
      await db
        .update(outbox)
        .set({ payload: JSON.stringify({ ...JSON.parse(pendingCreate.payload), ...payload }) })
        .where(eq(outbox.id, pendingCreate.id));
      return pendingCreate.id;
    }
  }

  const id = newClientId();
  await db.insert(outbox).values({
    id,
    entity,
    op,
    clientId,
    payload: JSON.stringify(payload),
    createdAt: new Date().toISOString(),
    retries: 0,
    lastError: null,
  });
  return id;
};

export const listOutbox = async (): Promise<OutboxItem[]> => {
  const rows = await getDb().select().from(outbox).orderBy(asc(outbox.createdAt));
  return rows.map((row) => ({
    id: row.id,
    entity: row.entity as OutboxItem['entity'],
    op: row.op as OutboxItem['op'],
    clientId: row.clientId,
    payload: row.payload,
    createdAt: row.createdAt,
    retries: row.retries,
    lastError: row.lastError,
  }));
};

export const countOutbox = async () => {
  const rows = await getDb().select().from(outbox);
  return rows.length;
};

export const removeOutbox = async (id: string) => {
  await getDb().delete(outbox).where(eq(outbox.id, id));
};

export const markOutboxError = async (id: string, message: string) => {
  const row = await getDb().select().from(outbox).where(eq(outbox.id, id)).get();
  await getDb()
    .update(outbox)
    .set({ retries: (row?.retries ?? 0) + 1, lastError: message })
    .where(eq(outbox.id, id));
};

export const hasPendingFor = async (entity: OutboxEntity, clientId: string) => {
  const row = await getDb()
    .select()
    .from(outbox)
    .where(and(eq(outbox.entity, entity), eq(outbox.clientId, clientId)))
    .get();
  return Boolean(row);
};

export const hasPendingForServerIds = async (entity: OutboxEntity, clientIds: string[]) => {
  if (clientIds.length === 0) return new Set<string>();
  const rows = await getDb()
    .select()
    .from(outbox)
    .where(
      and(
        eq(outbox.entity, entity),
        or(...clientIds.map((id) => eq(outbox.clientId, id))),
      ),
    );
  return new Set(rows.map((row) => row.clientId));
};
