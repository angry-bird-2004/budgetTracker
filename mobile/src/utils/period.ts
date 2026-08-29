import type { PeriodKey } from '../types';

export const PERIOD_OPTIONS: { key: PeriodKey; label: string }[] = [
  { key: 'all', label: 'All Time' },
  { key: 'today', label: 'Today' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'financial-year', label: 'Financial Year' },
  { key: 'yearly', label: 'Yearly' },
];

export const DEFAULT_PERIOD: PeriodKey = 'all';
export const PERIOD_STORAGE_KEY = 'budgetTrackerPeriod';

export const isValidPeriod = (value: unknown): value is PeriodKey =>
  PERIOD_OPTIONS.some((option) => option.key === value);

export const getPeriodRange = (period: PeriodKey, now = new Date()) => {
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();
  const day = now.getDay();

  if (period === 'today') {
    return {
      start: new Date(y, m, d, 0, 0, 0, 0),
      end: new Date(y, m, d, 23, 59, 59, 999),
    };
  }
  if (period === 'weekly') {
    return {
      start: new Date(y, m, d - day, 0, 0, 0, 0),
      end: new Date(y, m, d - day + 6, 23, 59, 59, 999),
    };
  }
  if (period === 'monthly') {
    return {
      start: new Date(y, m, 1, 0, 0, 0, 0),
      end: new Date(y, m + 1, 0, 23, 59, 59, 999),
    };
  }
  if (period === 'yearly') {
    return {
      start: new Date(y, 0, 1, 0, 0, 0, 0),
      end: new Date(y, 11, 31, 23, 59, 59, 999),
    };
  }
  if (period === 'financial-year') {
    const fyStartYear = m >= 6 ? y : y - 1;
    return {
      start: new Date(fyStartYear, 6, 1, 0, 0, 0, 0),
      end: new Date(fyStartYear + 1, 5, 30, 23, 59, 59, 999),
    };
  }
  return null;
};

export const inPeriod = (dateValue: string | Date, period: PeriodKey) => {
  const range = getPeriodRange(period);
  if (!range) return true;
  const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
  if (Number.isNaN(date.getTime())) return false;
  return date >= range.start && date <= range.end;
};
