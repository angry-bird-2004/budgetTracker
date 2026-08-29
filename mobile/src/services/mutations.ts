import { enqueueOutbox } from '../db/repos/outbox';
import { deleteEnvelopeLocal, upsertEnvelope } from '../db/repos/envelopes';
import { deleteIncomeEnvelopeLocal, upsertIncomeEnvelope } from '../db/repos/incomeEnvelopes';
import { deleteTransactionLocal, upsertTransaction } from '../db/repos/transactions';
import { upsertSettings } from '../db/repos/settings';
import { useBudgetStore } from '../store/budget';
import { runSync } from '../sync/engine';
import type { Settings, TaxApplication, TransactionType } from '../types';
import { newClientId } from '../utils/id';

const nowIso = () => new Date().toISOString();

const reloadAndSync = async () => {
  await useBudgetStore.getState().load();
  runSync().catch(() => undefined);
};

export const saveEnvelope = async (input: {
  clientId?: string;
  name: string;
  allocatedAmount: number;
}) => {
  const clientId = input.clientId || newClientId();
  const existing = useBudgetStore.getState().envelopes.find((item) => item.clientId === clientId);
  const timestamp = nowIso();
  await upsertEnvelope({
    clientId,
    serverId: existing?.serverId ?? null,
    name: input.name,
    allocatedAmount: input.allocatedAmount,
    isSystem: existing?.isSystem ?? false,
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
  });
  await enqueueOutbox(
    'envelope',
    existing ? 'update' : 'create',
    clientId,
    { name: input.name, allocatedAmount: input.allocatedAmount, clientId },
  );
  await reloadAndSync();
  return clientId;
};

export const removeEnvelope = async (clientId: string) => {
  await deleteEnvelopeLocal(clientId);
  await enqueueOutbox('envelope', 'delete', clientId);
  await reloadAndSync();
};

export const saveIncomeEnvelope = async (input: {
  clientId?: string;
  name: string;
  allocatedAmount: number;
}) => {
  const clientId = input.clientId || newClientId();
  const existing = useBudgetStore
    .getState()
    .incomeEnvelopes.find((item) => item.clientId === clientId);
  const timestamp = nowIso();
  await upsertIncomeEnvelope({
    clientId,
    serverId: existing?.serverId ?? null,
    name: input.name,
    allocatedAmount: input.allocatedAmount,
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
  });
  await enqueueOutbox(
    'incomeEnvelope',
    existing ? 'update' : 'create',
    clientId,
    { name: input.name, allocatedAmount: input.allocatedAmount, clientId },
  );
  await reloadAndSync();
  return clientId;
};

export const removeIncomeEnvelope = async (clientId: string) => {
  await deleteIncomeEnvelopeLocal(clientId);
  await enqueueOutbox('incomeEnvelope', 'delete', clientId);
  await reloadAndSync();
};

export const saveTransaction = async (input: {
  clientId?: string;
  title: string;
  amount: number;
  type: TransactionType;
  envelopeClientId?: string | null;
  incomeClientId?: string | null;
  paymentMethod: string;
  purpose?: string;
  taxPercentage?: number | null;
  taxAmount?: number | null;
  taxApplication?: TaxApplication | null;
  date: string;
}) => {
  const clientId = input.clientId || newClientId();
  const existing = useBudgetStore.getState().transactions.find((item) => item.clientId === clientId);
  const timestamp = nowIso();
  await upsertTransaction({
    clientId,
    serverId: existing?.serverId ?? null,
    title: input.title,
    amount: input.amount,
    type: input.type,
    envelopeClientId: input.envelopeClientId || null,
    incomeClientId: input.incomeClientId || null,
    paymentMethod: input.paymentMethod,
    purpose: input.purpose || '',
    taxPercentage: input.taxPercentage ?? null,
    taxAmount: input.taxAmount ?? null,
    taxApplication: input.taxApplication ?? null,
    date: input.date,
    updateLogs: existing ? JSON.stringify(existing.updateLogs) : null,
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
  });
  await enqueueOutbox('transaction', existing ? 'update' : 'create', clientId, {
    clientId,
    title: input.title,
    amount: input.amount,
    type: input.type,
    envelopeClientId: input.envelopeClientId || undefined,
    incomeClientId: input.incomeClientId || undefined,
    paymentMethod: input.paymentMethod,
    purpose: input.purpose,
    taxPercentage: input.taxPercentage,
    taxAmount: input.taxAmount,
    taxApplication: input.taxApplication,
    date: input.date,
  });
  const envelopes = useBudgetStore.getState().envelopes;
  const incomeEnvelopes = useBudgetStore.getState().incomeEnvelopes;
  useBudgetStore.getState().upsertLocalTransaction({
    clientId,
    serverId: existing?.serverId ?? null,
    title: input.title,
    amount: input.amount,
    type: input.type,
    envelopeClientId: input.envelopeClientId || null,
    incomeClientId: input.incomeClientId || null,
    paymentMethod: input.paymentMethod,
    purpose: input.purpose || '',
    taxPercentage: input.taxPercentage ?? null,
    taxAmount: input.taxAmount ?? null,
    taxApplication: input.taxApplication ?? null,
    date: input.date,
    updateLogs: existing?.updateLogs ?? [],
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
    envelopeName: envelopes.find((item) => item.clientId === input.envelopeClientId)?.name ?? null,
    incomeName: incomeEnvelopes.find((item) => item.clientId === input.incomeClientId)?.name ?? null,
  });
  await reloadAndSync();
  return clientId;
};

export const removeTransaction = async (clientId: string) => {
  await deleteTransactionLocal(clientId);
  await enqueueOutbox('transaction', 'delete', clientId);
  await reloadAndSync();
};

export const transferLocal = async (input: {
  type: 'expense' | 'income';
  fromClientId: string;
  toClientId: string;
  amount: number;
}) => {
  const timestamp = nowIso();
  if (input.type === 'expense') {
    const from = useBudgetStore.getState().envelopes.find((item) => item.clientId === input.fromClientId);
    const to = useBudgetStore.getState().envelopes.find((item) => item.clientId === input.toClientId);
    if (!from || !to) throw new Error('Envelope not found');
    await upsertEnvelope({
      ...from,
      allocatedAmount: from.allocatedAmount - input.amount,
      updatedAt: timestamp,
    });
    await upsertEnvelope({
      ...to,
      allocatedAmount: to.allocatedAmount + input.amount,
      updatedAt: timestamp,
    });
  } else {
    const from = useBudgetStore
      .getState()
      .incomeEnvelopes.find((item) => item.clientId === input.fromClientId);
    const to = useBudgetStore
      .getState()
      .incomeEnvelopes.find((item) => item.clientId === input.toClientId);
    if (!from || !to) throw new Error('Income envelope not found');
    await upsertIncomeEnvelope({
      ...from,
      allocatedAmount: from.allocatedAmount - input.amount,
      updatedAt: timestamp,
    });
    await upsertIncomeEnvelope({
      ...to,
      allocatedAmount: to.allocatedAmount + input.amount,
      updatedAt: timestamp,
    });
  }

  await enqueueOutbox('transfer', 'create', newClientId(), input);
  await reloadAndSync();
};

export const saveSettings = async (next: Settings) => {
  await upsertSettings(next);
  await enqueueOutbox('settings', 'update', 'settings', next);
  await reloadAndSync();
};
