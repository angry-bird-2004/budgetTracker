// frontend/src/services/api.js
import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL ||
  (window.location.hostname === "localhost"
    ? "http://localhost:5000/api"
    : "/api");

const API = axios.create({ baseURL: API_URL });

// undefined = not loaded yet, null = logged out, string = active token
let cachedToken = undefined;

const loadCachedToken = () => {
  try {
    const userInfo = localStorage.getItem("userInfo");
    if (!userInfo) {
      cachedToken = null;
      return null;
    }
    const parsed = JSON.parse(userInfo);
    cachedToken = parsed?.token || null;
    return cachedToken;
  } catch (e) {
    localStorage.removeItem("userInfo");
    cachedToken = null;
    return null;
  }
};

export const setAuthToken = (token) => {
  cachedToken = token || null;
};

loadCachedToken();

window.addEventListener("storage", (e) => {
  if (e.key === "userInfo") loadCachedToken();
});

API.interceptors.request.use((config) => {
  try {
    const token = cachedToken === undefined ? loadCachedToken() : cachedToken;
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (err) {
    // fall back silently
  }
  return config;
});

// Auth services
export const loginAPI = (data) => API.post("/auth/login", data);
export const registerAPI = (data) => API.post("/auth/register", data);

// Envelope & Transaction services
export const fetchEnvelopes = () => API.get("/envelopes");
export const addEnvelope = (data) => API.post("/envelopes", data);
export const removeEnvelope = (id) => API.delete(`/envelopes/${id}`);
export const updateEnvelope = (id, data) => API.put(`/envelopes/${id}`, data);
export const transferFunds = (data) => API.post("/envelopes/transfer", data);

// Transfer History service
export const fetchTransfers = (period = "all") => {
  const params = new URLSearchParams({ period: period || "all" });
  return API.get(`/envelopes/transfers?${params.toString()}`);
};

// Transfer history APIs
export const removeTransfer = (id) => API.delete(`/envelopes/transfers/${id}`);
export const updateTransfer = (id, data) =>
  API.put(`/envelopes/transfers/${id}`, data);

// Income Envelope services
export const fetchIncomeEnvelopes = () => API.get("/income-envelopes");
export const addIncomeEnvelope = (data) => API.post("/income-envelopes", data);
export const updateIncomeEnvelope = (id, data) =>
  API.put(`/income-envelopes/${id}`, data);
export const removeIncomeEnvelope = (id) =>
  API.delete(`/income-envelopes/${id}`);

export const updateTransaction = (id, data) =>
  API.put(`/transactions/${id}`, data);

export const fetchTransactions = (
  period,
  page = 1,
  limit = 50,
  extras = {},
) => {
  const params = new URLSearchParams({
    period: period || "all",
    page: String(page),
    limit: String(limit),
  });
  const search = extras.search?.trim();
  if (search) params.set("search", search);
  if (extras.type && extras.type !== "all") params.set("type", extras.type);
  if (extras.sort) params.set("sort", extras.sort);
  if (extras.envelopeId) params.set("envelopeId", extras.envelopeId);
  if (extras.incomeSource) params.set("incomeSource", extras.incomeSource);
  params.set("tzOffset", String(new Date().getTimezoneOffset()));
  return API.get(`/transactions?${params.toString()}`);
};

export const fetchAllTransactions = async (
  period,
  extras = {},
  pageLimit = 100,
) => {
  const transactions = [];
  let page = 1;
  let pages = 1;
  let total = 0;
  let totals = { income: 0, expense: 0, tax: 0 };

  do {
    const res = await fetchTransactions(period, page, pageLimit, extras);
    const batch = Array.isArray(res.data?.transactions)
      ? res.data.transactions
      : [];
    transactions.push(...batch);
    pages = Number(res.data?.pages) || 1;
    total = Number(res.data?.total) || 0;
    if (res.data?.totals) totals = res.data.totals;
    page += 1;
  } while (page <= pages && page <= 50);

  return { transactions, total, totals };
};

export const addTransaction = (data) => API.post("/transactions", data);
export const removeTransaction = (id) => API.delete(`/transactions/${id}`);

export const fetchSettings = () => API.get("/settings");
export const updateSettings = (data) => API.put("/settings", data);

export default API;
