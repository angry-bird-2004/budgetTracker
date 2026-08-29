import { hasPendingFor } from '../db/repos/outbox';
import {
  deleteEnvelopeByServerId,
  getEnvelopeByServerId,
  upsertEnvelope,
} from '../db/repos/envelopes';
import {
  deleteIncomeEnvelopeByServerId,
  getIncomeEnvelopeByServerId,
  upsertIncomeEnvelope,
} from '../db/repos/incomeEnvelopes';
import {
  deleteTransactionByServerId,
  getTransactionByServerId,
  upsertTransaction,
} from '../db/repos/transactions';
import { upsertSettings } from '../db/repos/settings';
import { getClientIdByServerId } from '../db/repos/idMap';
import type { SyncPayload } from '../api/endpoints';
import type { TaxApplication, TransactionType } from '../types';

const asId = (value: unknown): string | null => {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value && '_id' in value) {
    return String((value as { _id: string })._id);
  }
  return null;
};

const asClientId = (value: unknown): string | null => {
  if (value && typeof value === 'object' && 'clientId' in value) {
    const clientId = (value as { clientId?: string }).clientId;
    return clientId || null;
  }
  return null;
};

const asIso = (value: unknown) => {
  if (!value) return null;
  const date = new Date(value as string);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const newerOrEqual = (incoming?: string | null, local?: string | null) => {
  if (!incoming) return true;
  if (!local) return true;
  return new Date(incoming).getTime() >= new Date(local).getTime();
};

export const mergeSyncPayload = async (payload: SyncPayload) => {
  for (const env of payload.envelopes || []) {
    const serverId = asId(env._id);
    const clientId = env.clientId || serverId;
    if (!clientId) continue;
    if (await hasPendingFor('envelope', clientId)) continue;
    const existing = serverId ? await getEnvelopeByServerId(serverId) : null;
    if (existing && !newerOrEqual(asIso(env.updatedAt), existing.updatedAt)) continue;
    await upsertEnvelope({
      clientId: existing?.clientId ?? clientId,
      serverId,
      name: env.name,
      allocatedAmount: Number(env.allocatedAmount || 0),
      isSystem: Boolean(env.isSystem),
      createdAt: asIso(env.createdAt),
      updatedAt: asIso(env.updatedAt),
    });
  }

  for (const env of payload.incomeEnvelopes || []) {
    const serverId = asId(env._id);
    const clientId = env.clientId || serverId;
    if (!clientId) continue;
    if (await hasPendingFor('incomeEnvelope', clientId)) continue;
    const existing = serverId ? await getIncomeEnvelopeByServerId(serverId) : null;
    if (existing && !newerOrEqual(asIso(env.updatedAt), existing.updatedAt)) continue;
    await upsertIncomeEnvelope({
      clientId: existing?.clientId ?? clientId,
      serverId,
      name: env.name,
      allocatedAmount: Number(env.allocatedAmount || 0),
      createdAt: asIso(env.createdAt),
      updatedAt: asIso(env.updatedAt),
    });
  }

  for (const tx of payload.transactions || []) {
    const serverId = asId(tx._id);
    const clientId = tx.clientId || serverId;
    if (!clientId) continue;
    if (await hasPendingFor('transaction', clientId)) continue;
    const existing = serverId ? await getTransactionByServerId(serverId) : null;
    if (existing && !newerOrEqual(asIso(tx.updatedAt), existing.updatedAt)) continue;

    const envelopeServerId = asId(tx.envelopeId);
    const incomeServerId = asId(tx.incomeSource);
    const envelopeClientId =
      asClientId(tx.envelopeId) ||
      (envelopeServerId ? await getClientIdByServerId('envelope', envelopeServerId) : null) ||
      envelopeServerId;
    const incomeClientId =
      asClientId(tx.incomeSource) ||
      (incomeServerId ? await getClientIdByServerId('incomeEnvelope', incomeServerId) : null) ||
      incomeServerId;

    await upsertTransaction({
      clientId: existing?.clientId ?? clientId,
      serverId,
      title: tx.title,
      amount: Number(tx.amount || 0),
      type: tx.type as TransactionType,
      envelopeClientId,
      incomeClientId,
      paymentMethod: tx.paymentMethod || 'cash',
      purpose: tx.purpose || '',
      taxPercentage: tx.taxPercentage ?? null,
      taxAmount: tx.taxAmount ?? null,
      taxApplication: (tx.taxApplication as TaxApplication) || null,
      date: asIso(tx.date) || new Date().toISOString(),
      updateLogs: tx.updateLogs ? JSON.stringify(tx.updateLogs) : null,
      createdAt: asIso(tx.createdAt),
      updatedAt: asIso(tx.updatedAt),
    });
  }

  if (payload.settings?.transactionPageSize) {
    if (!(await hasPendingFor('settings', 'settings'))) {
      await upsertSettings({ transactionPageSize: payload.settings.transactionPageSize });
    }
  }

  for (const id of payload.deletedIds?.envelopes || []) {
    const local = await getEnvelopeByServerId(id);
    if (local && (await hasPendingFor('envelope', local.clientId))) continue;
    await deleteEnvelopeByServerId(id);
  }
  for (const id of payload.deletedIds?.incomeEnvelopes || []) {
    const local = await getIncomeEnvelopeByServerId(id);
    if (local && (await hasPendingFor('incomeEnvelope', local.clientId))) continue;
    await deleteIncomeEnvelopeByServerId(id);
  }
  for (const id of payload.deletedIds?.transactions || []) {
    const local = await getTransactionByServerId(id);
    if (local && (await hasPendingFor('transaction', local.clientId))) continue;
    await deleteTransactionByServerId(id);
  }
};
