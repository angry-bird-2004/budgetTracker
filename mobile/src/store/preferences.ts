import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import type { Currency, PeriodKey } from '../types';
import { DEFAULT_PERIOD, isValidPeriod, PERIOD_STORAGE_KEY } from '../utils/period';

const CURRENCY_KEY = 'budgetTrackerCurrency';
const INCOME_LINKER_KEY = 'budgetTrackerLinkedIncome';
const RATE_KEY = 'usd_pkr_exchange_rate';
const RATE_TIME_KEY = 'usd_pkr_rate_timestamp';
const FALLBACK_RATE = 278;
const CACHE_DURATION = 12 * 60 * 60 * 1000;

type PreferencesState = {
  period: PeriodKey;
  currency: Currency;
  conversionRate: number;
  linkedIncomeClientId: string;
  hydrate: () => Promise<void>;
  setPeriod: (period: PeriodKey) => Promise<void>;
  setCurrency: (currency: Currency) => Promise<void>;
  setLinkedIncomeClientId: (id: string) => Promise<void>;
  refreshRate: () => Promise<void>;
};

export const usePreferences = create<PreferencesState>((set, get) => ({
  period: DEFAULT_PERIOD,
  currency: 'PKR',
  conversionRate: FALLBACK_RATE,
  linkedIncomeClientId: '',
  hydrate: async () => {
    const [period, currency, linked, cachedRate, cachedTime] = await Promise.all([
      AsyncStorage.getItem(PERIOD_STORAGE_KEY),
      AsyncStorage.getItem(CURRENCY_KEY),
      AsyncStorage.getItem(INCOME_LINKER_KEY),
      AsyncStorage.getItem(RATE_KEY),
      AsyncStorage.getItem(RATE_TIME_KEY),
    ]);
    set({
      period: isValidPeriod(period) ? period : DEFAULT_PERIOD,
      currency: currency === 'USD' ? 'USD' : 'PKR',
      linkedIncomeClientId: linked || '',
      conversionRate: cachedRate ? Number(cachedRate) : FALLBACK_RATE,
    });
    const fresh =
      cachedRate && cachedTime && Date.now() - Number(cachedTime) < CACHE_DURATION;
    if (!fresh) {
      await get().refreshRate();
    }
  },
  setPeriod: async (period) => {
    set({ period });
    await AsyncStorage.setItem(PERIOD_STORAGE_KEY, period);
  },
  setCurrency: async (currency) => {
    set({ currency });
    await AsyncStorage.setItem(CURRENCY_KEY, currency);
  },
  setLinkedIncomeClientId: async (id) => {
    set({ linkedIncomeClientId: id });
    if (id) await AsyncStorage.setItem(INCOME_LINKER_KEY, id);
    else await AsyncStorage.removeItem(INCOME_LINKER_KEY);
  },
  refreshRate: async () => {
    try {
      const response = await fetch('https://open.er-api.com/v6/latest/USD');
      const data = await response.json();
      if (data?.rates?.PKR) {
        const rate = Number(data.rates.PKR);
        set({ conversionRate: rate });
        await AsyncStorage.setItem(RATE_KEY, String(rate));
        await AsyncStorage.setItem(RATE_TIME_KEY, String(Date.now()));
      }
    } catch {
      // Keep cached / fallback rate while offline.
    }
  },
}));
