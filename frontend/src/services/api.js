// frontend/src/services/api.js
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL ||
  (window.location.hostname === 'localhost'
    ? 'http://localhost:5000/api'
    : '/api');

const API = axios.create({ baseURL: API_URL });

// undefined = not loaded yet, null = logged out, string = active token
let cachedToken = undefined;

const loadCachedToken = () => {
  try {
    const userInfo = localStorage.getItem('userInfo');
    if (!userInfo) {
      cachedToken = null;
      return null;
    }
    const parsed = JSON.parse(userInfo);
    cachedToken = parsed?.token || null;
    return cachedToken;
  } catch (e) {
    localStorage.removeItem('userInfo');
    cachedToken = null;
    return null;
  }
};

export const setAuthToken = (token) => {
  cachedToken = token || null;
};

loadCachedToken();

window.addEventListener('storage', (e) => {
  if (e.key === 'userInfo') loadCachedToken();
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

// IMPORTANT: Make sure these names match what AuthContext.jsx imports
export const loginAPI = (data) => API.post('/auth/login', data);
export const registerAPI = (data) => API.post('/auth/register', data);

// Envelope & Transaction services
export const fetchEnvelopes = () => API.get('/envelopes');
export const addEnvelope = (data) => API.post('/envelopes', data);
export const removeEnvelope = (id) => API.delete(`/envelopes/${id}`);
export const updateEnvelope = (id, data) => API.put(`/envelopes/${id}`, data);
export const transferFunds = (data) => API.post('/envelopes/transfer', data);

// Income Envelope services
export const fetchIncomeEnvelopes = () => API.get('/income-envelopes');
export const addIncomeEnvelope = (data) => API.post('/income-envelopes', data);
export const updateIncomeEnvelope = (id, data) => API.put(`/income-envelopes/${id}`, data);
export const removeIncomeEnvelope = (id) => API.delete(`/income-envelopes/${id}`);

export const updateTransaction = (id, data) => API.put(`/transactions/${id}`, data);

export const fetchTransactions = (period, page = 1, limit = 50, extras = {}) => {
  const params = new URLSearchParams({
    period: period || 'all',
    page: String(page),
    limit: String(limit),
  });
  const search = extras.search?.trim();
  if (search) params.set('search', search);
  if (extras.type && extras.type !== 'all') params.set('type', extras.type);
  if (extras.sort) params.set('sort', extras.sort);
  params.set('tzOffset', String(new Date().getTimezoneOffset()));
  return API.get(`/transactions?${params.toString()}`);
};
export const addTransaction = (data) => API.post('/transactions', data);
export const removeTransaction = (id) => API.delete(`/transactions/${id}`);

export default API;
