export const PERIOD_OPTIONS = [
  { key: "all", label: "All Time" },
  { key: "today", label: "Today" },
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
  { key: "financial-year", label: "Financial Year (Jul-Jun)" },
  { key: "yearly", label: "Yearly" },
];

export const PERIOD_RANGE_LABELS = {
  all: "all time",
  today: "today",
  weekly: "this week",
  monthly: "this month",
  yearly: "this year",
  "financial-year": "this financial year",
};

export const PERIOD_KEYS = PERIOD_OPTIONS.map((option) => option.key);
export const DEFAULT_PERIOD = "all";
export const PERIOD_STORAGE_KEY = "budgetTrackerPeriod";

export const isValidPeriod = (value) => PERIOD_KEYS.includes(value);

export const readStoredPeriod = (storage) => {
  const store =
    storage ?? (typeof localStorage === "undefined" ? null : localStorage);
  if (!store) return DEFAULT_PERIOD;

  try {
    const stored = store.getItem(PERIOD_STORAGE_KEY);
    return isValidPeriod(stored) ? stored : DEFAULT_PERIOD;
  } catch {
    return DEFAULT_PERIOD;
  }
};

export const writeStoredPeriod = (period, storage) => {
  if (!isValidPeriod(period)) return false;

  const store =
    storage ?? (typeof localStorage === "undefined" ? null : localStorage);
  if (!store) return false;

  try {
    store.setItem(PERIOD_STORAGE_KEY, period);
    return true;
  } catch {
    return false;
  }
};

export const getPeriodRangeLabel = (period) =>
  PERIOD_RANGE_LABELS[period] || PERIOD_RANGE_LABELS[DEFAULT_PERIOD];
