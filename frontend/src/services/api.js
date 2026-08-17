// frontend/src/services/api.js
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL ||
  (window.location.hostname === 'localhost'
    ? 'http://localhost:5000/api'
    : '/api');

const API = axios.create({ baseURL: API_URL });

// This attaches the token to every request automatically
API.interceptors.request.use((config) => {
  try {
    const userInfo = localStorage.getItem('userInfo');
    if (!userInfo) return config;

    const parsed = JSON.parse(userInfo);
    const token = parsed?.token;

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    localStorage.removeItem('userInfo');
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
export const postFill = (data) => API.post('/transactions/fill', data);
export const updateEnvelope = (id, data) => API.put(`/envelopes/${id}`, data);

// Income Envelope services
export const fetchIncomeEnvelopes = () => API.get('/income-envelopes');
export const addIncomeEnvelope = (data) => API.post('/income-envelopes', data);
export const updateIncomeEnvelope = (id, data) => API.put(`/income-envelopes/${id}`, data);
export const removeIncomeEnvelope = (id) => API.delete(`/income-envelopes/${id}`);

export const updateTransaction = (id, data) => API.put(`/transactions/${id}`, data);

export const fetchTransactions = (period) => API.get(`/transactions?period=${period}`);
export const addTransaction = (data) => API.post('/transactions', data);
export const removeTransaction = (id) => API.delete(`/transactions/${id}`);

export default API;
