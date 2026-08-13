// frontend/src/services/api.js
import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:5000/api' });

// This attaches the token to every request automatically
API.interceptors.request.use((config) => {
  const userInfo = localStorage.getItem('userInfo');
  if (userInfo) {
    const { token } = JSON.parse(userInfo);
    config.headers.Authorization = `Bearer ${token}`;
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
export const postFill = (data) => api.post('/transactions/fill', data);
export const updateEnvelope = (id, data) => API.put(`/envelopes/${id}`, data);

export const updateTransaction = (id, data) => API.put(`/transactions/${id}`, data);

export const fetchTransactions = (period) => API.get(`/transactions?period=${period}`);
export const addTransaction = (data) => API.post('/transactions', data);
export const removeTransaction = (id) => API.delete(`/transactions/${id}`);

export default API;
