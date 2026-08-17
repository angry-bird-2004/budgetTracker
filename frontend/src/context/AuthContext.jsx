import React, { createContext, useState, useEffect } from 'react';
import { loginAPI, registerAPI } from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    try {
      const userInfo = localStorage.getItem('userInfo');
      if (userInfo) {
        const parsed = JSON.parse(userInfo);
        if (parsed?.token) setUser(parsed);
        else localStorage.removeItem('userInfo');
      }
    } catch (error) {
      localStorage.removeItem('userInfo');
    }
  }, []);

  const login = async (credentials) => {
    const { data } = await loginAPI(credentials);
    if (!data?.token) throw new Error('Login response did not include a token');
    localStorage.setItem('userInfo', JSON.stringify(data));
    setUser(data);
  };

  const register = async (credentials) => {
    const { data } = await registerAPI(credentials);
    if (!data?.token) throw new Error('Register response did not include a token');
    localStorage.setItem('userInfo', JSON.stringify(data));
    setUser(data);
  };

  const logout = () => {
    localStorage.removeItem('userInfo');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};