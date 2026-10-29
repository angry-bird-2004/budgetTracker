import axios from "axios";
import * as SecureStore from "expo-secure-store";

const API_URL = process.env.EXPO_PUBLIC_API_URL?.trim();
if (!API_URL) {
  console.warn(
    "EXPO_PUBLIC_API_URL is not set. Add it to mobile/.env before using the app.",
  );
}

const api = axios.create({
  baseURL: API_URL || "http://localhost:5000/api",
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync("budgetTrackerToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const authApi = {
  login: (credentials) => api.post("/auth/login", credentials),
  register: (credentials) => api.post("/auth/register", credentials),
};

const periodParams = (period) => ({
  period: period || "all",
  tzOffset: String(new Date().getTimezoneOffset()),
});

export const financeApi = {
  envelopes: () => api.get("/envelopes"),
  createEnvelope: (data) => api.post("/envelopes", data),
  updateEnvelope: (id, data) => api.put(`/envelopes/${id}`, data),
  deleteEnvelope: (id) => api.delete(`/envelopes/${id}`),
  incomeEnvelopes: () => api.get("/income-envelopes"),
  createIncomeEnvelope: (data) => api.post("/income-envelopes", data),
  updateIncomeEnvelope: (id, data) => api.put(`/income-envelopes/${id}`, data),
  deleteIncomeEnvelope: (id) => api.delete(`/income-envelopes/${id}`),
  transfers: (period) =>
    api.get("/envelopes/transfers", { params: periodParams(period) }),
  transfer: (data) => api.post("/envelopes/transfer", data),
  updateTransfer: (id, data) => api.put(`/envelopes/transfers/${id}`, data),
  deleteTransfer: (id) => api.delete(`/envelopes/transfers/${id}`),
  transactions: (period, page, limit, extras = {}) =>
    api.get("/transactions", {
      params: {
        ...periodParams(period),
        page,
        limit,
        ...(extras.search ? { search: extras.search } : {}),
        ...(extras.type && extras.type !== "all" ? { type: extras.type } : {}),
        ...(extras.startDate ? { startDate: extras.startDate } : {}),
        ...(extras.endDate ? { endDate: extras.endDate } : {}),
      },
    }),
  allTransactions: async (period, extras = {}, limit = 100) => {
    let page = 1;
    let pages = 1;
    const transactions = [];
    let totals = { income: 0, expense: 0, tax: 0 };
    do {
      const { data } = await financeApi.transactions(period, page, limit, extras);
      transactions.push(...(Array.isArray(data.transactions) ? data.transactions : []));
      pages = Number(data.pages) || 1;
      if (data.totals) totals = data.totals;
      page += 1;
    } while (page <= pages && page <= 50);
    return { transactions, totals };
  },
  createTransaction: (data) => api.post("/transactions", data),
  updateTransaction: (id, data) => api.put(`/transactions/${id}`, data),
  deleteTransaction: (id) => api.delete(`/transactions/${id}`),
  settings: () => api.get("/settings"),
  updateSettings: (data) => api.put("/settings", data),
};

export const apiError = (error) =>
  error?.response?.data?.message ||
  (error?.code === "ECONNABORTED"
    ? "The server took too long to respond. Please try again."
    : error?.code === "ERR_NETWORK" || error?.message === "Network Error"
      ? "Can't reach the server. Check that the backend is running, your phone and laptop are on the same Wi-Fi, and EXPO_PUBLIC_API_URL uses your laptop's LAN IP."
    : error?.message || "Something went wrong. Please try again.");

export default api;
