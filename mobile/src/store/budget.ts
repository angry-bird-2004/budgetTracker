import { create } from 'zustand';
import { initDatabase } from '../db/client';
import { listEnvelopeRows } from '../db/repos/envelopes';
import { listIncomeEnvelopeRows } from '../db/repos/incomeEnvelopes';
import { getSettings } from '../db/repos/settings';
import { listTransactionRows } from '../db/repos/transactions';
import { toTransaction, withEnvelopeStats, withIncomeStats } from '../db/stats';
import type { Envelope, IncomeEnvelope, Settings, Transaction } from '../types';

type BudgetState = {
  ready: boolean;
  envelopes: Envelope[];
  incomeEnvelopes: IncomeEnvelope[];
  transactions: Transaction[];
  settings: Settings;
  load: () => Promise<void>;
  upsertLocalTransaction: (transaction: Transaction) => void;
};

export const useBudgetStore = create<BudgetState>((set) => ({
  ready: false,
  envelopes: [],
  incomeEnvelopes: [],
  transactions: [],
  settings: { transactionPageSize: 50 },
  load: async () => {
    await initDatabase();
    const [envelopeRows, incomeRows, txRows, settings] = await Promise.all([
      listEnvelopeRows(),
      listIncomeEnvelopeRows(),
      listTransactionRows(),
      getSettings(),
    ]);

    const envelopeNameById = new Map(envelopeRows.map((row) => [row.clientId, row.name]));
    const incomeNameById = new Map(incomeRows.map((row) => [row.clientId, row.name]));
    const transactions = txRows.map((row) =>
      toTransaction(
        row,
        row.envelopeClientId ? envelopeNameById.get(row.envelopeClientId) : null,
        row.incomeClientId ? incomeNameById.get(row.incomeClientId) : null,
      ),
    );

    set({
      ready: true,
      settings,
      transactions,
      envelopes: envelopeRows
        .map((row) => withEnvelopeStats(row, transactions))
        .sort((a, b) => a.name.localeCompare(b.name)),
      incomeEnvelopes: incomeRows
        .map((row) => withIncomeStats(row, transactions))
        .sort((a, b) => a.name.localeCompare(b.name)),
    });
  },
  upsertLocalTransaction: (transaction) => {
    set((state) => {
      const transactions = [
        transaction,
        ...state.transactions.filter((item) => item.clientId !== transaction.clientId),
      ];
      return {
        transactions,
        envelopes: state.envelopes.map((row) => {
          const { consumed, credited, currentBalance, ...rest } = row;
          return withEnvelopeStats(rest, transactions);
        }),
        incomeEnvelopes: state.incomeEnvelopes.map((row) => {
          const { consumed, income, tax, currentBalance, ...rest } = row;
          return withIncomeStats(rest, transactions);
        }),
      };
    });
  },
}));
