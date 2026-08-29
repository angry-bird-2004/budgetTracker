import { Platform } from 'react-native';
import { api } from './client';

export type AuthResponse = {
  _id: string;
  username: string;
  email: string;
  token: string;
  refreshToken: string;
};

export const loginRequest = (email: string, password: string) =>
  api.post<AuthResponse>('/auth/login', { email, password, deviceLabel: Platform.OS });

export const registerRequest = (username: string, email: string, password: string) =>
  api.post<AuthResponse>('/auth/register', {
    username,
    email,
    password,
    deviceLabel: Platform.OS,
  });

export const logoutRequest = (refreshToken: string) =>
  api.post('/auth/logout', { refreshToken });

export const createEnvelopeRequest = (data: Record<string, unknown>) =>
  api.post('/envelopes', data);

export const updateEnvelopeRequest = (id: string, data: Record<string, unknown>) =>
  api.put(`/envelopes/${id}`, data);

export const deleteEnvelopeRequest = (id: string) => api.delete(`/envelopes/${id}`);

export const transferFundsRequest = (data: Record<string, unknown>) =>
  api.post('/envelopes/transfer', data);

export const createIncomeEnvelopeRequest = (data: Record<string, unknown>) =>
  api.post('/income-envelopes', data);

export const updateIncomeEnvelopeRequest = (id: string, data: Record<string, unknown>) =>
  api.put(`/income-envelopes/${id}`, data);

export const deleteIncomeEnvelopeRequest = (id: string) =>
  api.delete(`/income-envelopes/${id}`);

export const createTransactionRequest = (data: Record<string, unknown>) =>
  api.post('/transactions', data);

export const updateTransactionRequest = (id: string, data: Record<string, unknown>) =>
  api.put(`/transactions/${id}`, data);

export const deleteTransactionRequest = (id: string) => api.delete(`/transactions/${id}`);

export const updateSettingsRequest = (data: Record<string, unknown>) =>
  api.put('/settings', data);

export type SyncPayload = {
  serverTime: string;
  envelopes: any[];
  incomeEnvelopes: any[];
  transactions: any[];
  settings: { transactionPageSize: number };
  deletedIds: {
    envelopes: string[];
    incomeEnvelopes: string[];
    transactions: string[];
  };
};

export const pullSync = (updatedSince?: string | null) =>
  api.get<SyncPayload>('/sync', {
    params: updatedSince ? { updatedSince } : undefined,
  });
