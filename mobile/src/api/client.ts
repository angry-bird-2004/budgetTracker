import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { Platform } from 'react-native';
import { clearSession, readSession, writeSession } from '../auth/session';
import type { Session } from '../types';
import { getApiUrl } from './baseUrl';

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean };

export const API_URL = getApiUrl();

export const api = axios.create({
  baseURL: API_URL,
  timeout: 20000,
});

let memorySession: Session | null = null;
let refreshPromise: Promise<Session | null> | null = null;
let onAuthInvalid: (() => void) | null = null;

export const setMemorySession = (session: Session | null) => {
  memorySession = session;
};

export const getMemorySession = () => memorySession;

export const setOnAuthInvalid = (handler: (() => void) | null) => {
  onAuthInvalid = handler;
};

const isAuthPath = (url?: string) =>
  Boolean(url && /\/auth\/(login|register|refresh|logout)/.test(url));

export const refreshSession = async (): Promise<Session | null> => {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const current = memorySession ?? (await readSession());
    if (!current?.refreshToken) return null;

    const { data } = await axios.post(`${API_URL}/auth/refresh`, {
      refreshToken: current.refreshToken,
      deviceLabel: Platform.OS,
    });

    const next: Session = {
      user: {
        _id: String(data._id),
        username: data.username,
        email: data.email,
      },
      accessToken: data.token,
      refreshToken: data.refreshToken,
    };
    memorySession = next;
    await writeSession(next);
    return next;
  })()
    .catch(async (error: AxiosError) => {
      if (error.response?.status === 401) {
        memorySession = null;
        await clearSession();
        onAuthInvalid?.();
      }
      return null;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
};

api.interceptors.request.use(async (config) => {
  const session = memorySession ?? (await readSession());
  if (session && !memorySession) memorySession = session;
  if (session?.accessToken) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${session.accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetryConfig | undefined;
    if (!original || original._retry || error.response?.status !== 401 || isAuthPath(original.url)) {
      return Promise.reject(error);
    }

    original._retry = true;
    const refreshed = await refreshSession();
    if (!refreshed) return Promise.reject(error);

    original.headers = original.headers ?? {};
    original.headers.Authorization = `Bearer ${refreshed.accessToken}`;
    return api(original);
  },
);

export const apiErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === 'string' && message) return message;
    if (!error.response) {
      return `Cannot reach the server at ${API_URL}. Keep the phone on the same Wi-Fi as this computer and make sure the backend is running.`;
    }
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
};
