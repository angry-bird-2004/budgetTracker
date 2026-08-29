import type { Envelope, IncomeEnvelope, Transaction } from '../types';
import { effectiveTaxAmount } from '../utils/tax';
import type { EnvelopeRow } from './repos/envelopes';
import type { IncomeEnvelopeRow } from './repos/incomeEnvelopes';
import type { TransactionRow } from './repos/transactions';
import { parseUpdateLogs } from './repos/transactions';

export const toTransaction = (
  row: TransactionRow,
  envelopeName?: string | null,
  incomeName?: string | null,
): Transaction => ({
  clientId: row.clientId,
  serverId: row.serverId,
  title: row.title,
  amount: row.amount,
  type: row.type,
  envelopeClientId: row.envelopeClientId,
  incomeClientId: row.incomeClientId,
  paymentMethod: row.paymentMethod,
  purpose: row.purpose || '',
  taxPercentage: row.taxPercentage,
  taxAmount: row.taxAmount,
  taxApplication: row.taxApplication,
  date: row.date,
  updateLogs: parseUpdateLogs(row.updateLogs),
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
  envelopeName: envelopeName ?? null,
  incomeName: incomeName ?? null,
});

export const withEnvelopeStats = (row: EnvelopeRow, txs: Transaction[]): Envelope => {
  const related = txs.filter((tx) => tx.envelopeClientId === row.clientId);
  const consumed = related
    .filter((tx) => tx.type === 'expense')
    .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
  const credited = related
    .filter((tx) => tx.type === 'income')
    .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
  return {
    ...row,
    consumed,
    credited,
    currentBalance: Number(row.allocatedAmount || 0) - consumed + credited,
  };
};

export const withIncomeStats = (row: IncomeEnvelopeRow, txs: Transaction[]): IncomeEnvelope => {
  const related = txs.filter((tx) => tx.incomeClientId === row.clientId);
  const consumed = related
    .filter((tx) => tx.type === 'expense')
    .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
  const income = related
    .filter((tx) => tx.type === 'income')
    .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
  const tax = related
    .filter((tx) => tx.type === 'expense')
    .reduce((sum, tx) => sum + effectiveTaxAmount(tx), 0);
  return {
    ...row,
    consumed,
    income,
    tax,
    currentBalance: Number(row.allocatedAmount || 0) + income - consumed,
  };
};
