import type { Currency } from '../types';

export const toBaseAmount = (value: number | string, currency: Currency, conversionRate = 1) => {
  const amount = Number(value) || 0;
  if (currency === 'USD') return amount * conversionRate;
  return amount;
};

export const fromBaseAmount = (value: number | string, currency: Currency, conversionRate = 1) => {
  const amount = Number(value) || 0;
  if (currency === 'USD') return conversionRate ? amount / conversionRate : amount;
  return amount;
};

export const formatAmount = (
  value: number | string,
  currency: Currency,
  conversionRate = 1,
) => {
  const converted = fromBaseAmount(value, currency, conversionRate);
  return converted.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const currencySymbol = (currency: Currency) => (currency === 'PKR' ? 'Rs ' : '$');
