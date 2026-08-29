import type { TaxApplication } from '../types';

export const effectiveTaxAmount = (tx: {
  taxAmount?: number | null;
  taxPercentage?: number | null;
  amount: number;
}) => {
  if (Number(tx.taxAmount) > 0) return Number(tx.taxAmount);
  if (Number(tx.taxPercentage) > 0) return (Number(tx.amount) * Number(tx.taxPercentage)) / 100;
  return 0;
};

export const buildTransactionAmount = ({
  baseAmount,
  taxAmountInput,
  taxPercentageInput,
  taxApplication,
  isExpense,
}: {
  baseAmount: number;
  taxAmountInput?: number;
  taxPercentageInput?: number;
  taxApplication: TaxApplication;
  isExpense: boolean;
}) => {
  if (!isExpense) {
    return { finalAmount: baseAmount, taxAmount: 0, taxPercentage: 0 };
  }

  let taxAmount = Number(taxAmountInput) || 0;
  const taxPercentage = Number(taxPercentageInput) || 0;
  if (taxPercentage > 0 && !taxAmountInput) {
    taxAmount = (baseAmount * taxPercentage) / 100;
  }

  let finalAmount = baseAmount;
  if (taxAmount > 0 || taxPercentage > 0) {
    finalAmount = taxApplication === 'exclusive' ? baseAmount + taxAmount : baseAmount;
  }

  return { finalAmount, taxAmount, taxPercentage };
};
