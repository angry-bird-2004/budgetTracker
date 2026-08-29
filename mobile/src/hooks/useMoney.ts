import { usePreferences } from '../store/preferences';
import { currencySymbol, formatAmount, fromBaseAmount, toBaseAmount } from '../utils/amounts';

export const useMoney = () => {
  const currency = usePreferences((state) => state.currency);
  const conversionRate = usePreferences((state) => state.conversionRate);

  return {
    currency,
    conversionRate,
    symbol: currencySymbol(currency),
    format: (value: number | string) => `${currencySymbol(currency)}${formatAmount(value, currency, conversionRate)}`,
    toBase: (value: number | string) => toBaseAmount(value, currency, conversionRate),
    fromBase: (value: number | string) => fromBaseAmount(value, currency, conversionRate),
  };
};
