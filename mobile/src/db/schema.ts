import { integer, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const envelopes = sqliteTable(
  'envelopes',
  {
    clientId: text('client_id').primaryKey(),
    serverId: text('server_id'),
    name: text('name').notNull(),
    allocatedAmount: real('allocated_amount').notNull().default(0),
    isSystem: integer('is_system', { mode: 'boolean' }).notNull().default(false),
    createdAt: text('created_at'),
    updatedAt: text('updated_at'),
  },
  (table) => [uniqueIndex('envelopes_server_id').on(table.serverId)],
);

export const incomeEnvelopes = sqliteTable(
  'income_envelopes',
  {
    clientId: text('client_id').primaryKey(),
    serverId: text('server_id'),
    name: text('name').notNull(),
    allocatedAmount: real('allocated_amount').notNull().default(0),
    createdAt: text('created_at'),
    updatedAt: text('updated_at'),
  },
  (table) => [uniqueIndex('income_envelopes_server_id').on(table.serverId)],
);

export const transactions = sqliteTable(
  'transactions',
  {
    clientId: text('client_id').primaryKey(),
    serverId: text('server_id'),
    title: text('title').notNull(),
    amount: real('amount').notNull(),
    type: text('type').notNull(),
    envelopeClientId: text('envelope_client_id'),
    incomeClientId: text('income_client_id'),
    paymentMethod: text('payment_method').notNull().default('cash'),
    purpose: text('purpose'),
    taxPercentage: real('tax_percentage'),
    taxAmount: real('tax_amount'),
    taxApplication: text('tax_application'),
    date: text('date').notNull(),
    updateLogs: text('update_logs'),
    createdAt: text('created_at'),
    updatedAt: text('updated_at'),
  },
  (table) => [uniqueIndex('transactions_server_id').on(table.serverId)],
);

export const settings = sqliteTable('settings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  transactionPageSize: integer('transaction_page_size').notNull().default(50),
});

export const outbox = sqliteTable('outbox', {
  id: text('id').primaryKey(),
  entity: text('entity').notNull(),
  op: text('op').notNull(),
  clientId: text('client_id').notNull(),
  payload: text('payload').notNull(),
  createdAt: text('created_at').notNull(),
  retries: integer('retries').notNull().default(0),
  lastError: text('last_error'),
});

export const idMap = sqliteTable(
  'id_map',
  {
    entity: text('entity').notNull(),
    clientId: text('client_id').notNull(),
    serverId: text('server_id').notNull(),
  },
  (table) => [uniqueIndex('id_map_entity_client').on(table.entity, table.clientId)],
);

export const syncState = sqliteTable('sync_state', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  lastServerTime: text('last_server_time'),
});
