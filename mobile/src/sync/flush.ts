import axios from 'axios';
import {
  createEnvelopeRequest,
  createIncomeEnvelopeRequest,
  createTransactionRequest,
  deleteEnvelopeRequest,
  deleteIncomeEnvelopeRequest,
  deleteTransactionRequest,
  transferFundsRequest,
  updateEnvelopeRequest,
  updateIncomeEnvelopeRequest,
  updateSettingsRequest,
  updateTransactionRequest,
} from '../api/endpoints';
import { getEnvelopeByClientId, upsertEnvelope } from '../db/repos/envelopes';
import { getIncomeEnvelopeByClientId, upsertIncomeEnvelope } from '../db/repos/incomeEnvelopes';
import { getTransactionByClientId, upsertTransaction } from '../db/repos/transactions';
import { getServerId } from '../db/repos/idMap';
import { listOutbox, markOutboxError, removeOutbox } from '../db/repos/outbox';
import type { OutboxItem } from '../types';

const asServerId = async (entity: 'envelope' | 'incomeEnvelope' | 'transaction', clientId?: string | null) => {
  if (!clientId) return undefined;
  return (await getServerId(entity, clientId)) || undefined;
};

const isIgnorableDelete = (error: unknown) => axios.isAxiosError(error) && error.response?.status === 404;

const flushItem = async (item: OutboxItem) => {
  const payload = item.payload ? JSON.parse(item.payload) : {};

  if (item.entity === 'envelope') {
    if (item.op === 'create') {
      const { data } = await createEnvelopeRequest(payload);
      const local = await getEnvelopeByClientId(item.clientId);
      if (local) {
        await upsertEnvelope({
          ...local,
          serverId: String(data._id),
          updatedAt: data.updatedAt || local.updatedAt,
        });
      }
      return;
    }
    const serverId = await asServerId('envelope', item.clientId);
    if (!serverId) throw new Error('Envelope is still waiting to sync');
    if (item.op === 'update') {
      await updateEnvelopeRequest(serverId, payload);
      return;
    }
    try {
      await deleteEnvelopeRequest(serverId);
    } catch (error) {
      if (!isIgnorableDelete(error)) throw error;
    }
    return;
  }

  if (item.entity === 'incomeEnvelope') {
    if (item.op === 'create') {
      const { data } = await createIncomeEnvelopeRequest(payload);
      const local = await getIncomeEnvelopeByClientId(item.clientId);
      if (local) {
        await upsertIncomeEnvelope({
          ...local,
          serverId: String(data._id),
          updatedAt: data.updatedAt || local.updatedAt,
        });
      }
      return;
    }
    const serverId = await asServerId('incomeEnvelope', item.clientId);
    if (!serverId) throw new Error('Income envelope is still waiting to sync');
    if (item.op === 'update') {
      await updateIncomeEnvelopeRequest(serverId, payload);
      return;
    }
    try {
      await deleteIncomeEnvelopeRequest(serverId);
    } catch (error) {
      if (!isIgnorableDelete(error)) throw error;
    }
    return;
  }

  if (item.entity === 'transaction') {
    if (item.op === 'create') {
      const envelopeId = await asServerId('envelope', payload.envelopeClientId);
      const incomeSource = await asServerId('incomeEnvelope', payload.incomeClientId);
      if (payload.envelopeClientId && !envelopeId) {
        throw new Error('Linked envelope is still waiting to sync');
      }
      if (payload.incomeClientId && !incomeSource) {
        throw new Error('Linked income envelope is still waiting to sync');
      }
      const { data } = await createTransactionRequest({
        clientId: payload.clientId || item.clientId,
        title: payload.title,
        amount: payload.amount,
        type: payload.type,
        envelopeId,
        incomeSource,
        paymentMethod: payload.paymentMethod,
        purpose: payload.purpose,
        taxPercentage: payload.taxPercentage,
        taxAmount: payload.taxAmount,
        taxApplication: payload.taxApplication,
        date: payload.date,
      });
      const local = await getTransactionByClientId(item.clientId);
      if (local) {
        await upsertTransaction({
          ...local,
          serverId: String(data._id),
          updatedAt: data.updatedAt || local.updatedAt,
        });
      }
      return;
    }
    const serverId = await asServerId('transaction', item.clientId);
    if (!serverId) throw new Error('Transaction is still waiting to sync');
    if (item.op === 'update') {
      const envelopeId = await asServerId('envelope', payload.envelopeClientId);
      const incomeSource = await asServerId('incomeEnvelope', payload.incomeClientId);
      await updateTransactionRequest(serverId, {
        ...payload,
        envelopeId,
        incomeSource,
      });
      return;
    }
    try {
      await deleteTransactionRequest(serverId);
    } catch (error) {
      if (!isIgnorableDelete(error)) throw error;
    }
    return;
  }

  if (item.entity === 'transfer') {
    const fromId = await asServerId(
      payload.type === 'income' ? 'incomeEnvelope' : 'envelope',
      payload.fromClientId,
    );
    const toId = await asServerId(
      payload.type === 'income' ? 'incomeEnvelope' : 'envelope',
      payload.toClientId,
    );
    if (!fromId || !toId) throw new Error('Transfer envelopes are still waiting to sync');
    await transferFundsRequest({
      type: payload.type,
      fromId,
      toId,
      amount: payload.amount,
    });
    return;
  }

  if (item.entity === 'settings') {
    await updateSettingsRequest(payload);
  }
};

export const flushOutbox = async () => {
  const items = await listOutbox();
  for (const item of items) {
    try {
      await flushItem(item);
      await removeOutbox(item.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sync failed';
      await markOutboxError(item.id, message);
      if (message.includes('waiting to sync')) {
        continue;
      }
      if (axios.isAxiosError(error) && !error.response) {
        throw error;
      }
      throw error;
    }
  }
};
