import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { loginRequest, logoutRequest, registerRequest } from '../api/endpoints';
import { apiErrorMessage, refreshSession, setMemorySession, setOnAuthInvalid } from '../api/client';
import { clearLocalDatabase } from '../db/client';
import type { AuthUser, Session } from '../types';
import { clearSession, readSession, writeSession } from './session';

type AuthContextValue = {
  user: AuthUser | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const toSession = (data: {
  _id: string;
  username: string;
  email: string;
  token: string;
  refreshToken: string;
}): Session => ({
  user: { _id: String(data._id), username: data.username, email: data.email },
  accessToken: data.token,
  refreshToken: data.refreshToken,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  const applySession = async (session: Session) => {
    setMemorySession(session);
    await writeSession(session);
    setUser(session.user);
  };

  useEffect(() => {
    setOnAuthInvalid(() => {
      setUser(null);
    });

    (async () => {
      const stored = await readSession();
      if (!stored) {
        setReady(true);
        return;
      }

      setMemorySession(stored);
      setUser(stored.user);

      const refreshed = await refreshSession();
      if (refreshed) {
        setUser(refreshed.user);
      } else if (!(await readSession())) {
        setUser(null);
      }
      setReady(true);
    })();

    return () => setOnAuthInvalid(null);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { data } = await loginRequest(email, password);
      await applySession(toSession(data));
    } catch (error) {
      throw new Error(apiErrorMessage(error, 'Login failed'));
    }
  };

  const register = async (username: string, email: string, password: string) => {
    try {
      const { data } = await registerRequest(username, email, password);
      await applySession(toSession(data));
    } catch (error) {
      throw new Error(apiErrorMessage(error, 'Registration failed'));
    }
  };

  const logout = async () => {
    const stored = await readSession();
    try {
      if (stored?.refreshToken) {
        await logoutRequest(stored.refreshToken);
      }
    } catch {
      // Local logout still proceeds if the network call fails.
    }
    setMemorySession(null);
    await clearSession();
    await clearLocalDatabase();
    setUser(null);
  };

  const value = useMemo(
    () => ({ user, ready, login, register, logout }),
    [user, ready],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
