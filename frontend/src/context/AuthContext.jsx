import React, { useState, useEffect } from "react";
import { loginAPI, registerAPI, setAuthToken } from "../services/api";
import { AuthContext } from "./authContext";

export { AuthContext };

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const userInfo = localStorage.getItem("userInfo");
      if (!userInfo) return null;
      const parsed = JSON.parse(userInfo);
      return parsed?.token ? parsed : null;
    } catch {
      localStorage.removeItem("userInfo");
      return null;
    }
  });

  useEffect(() => {
    try {
      const userInfo = localStorage.getItem("userInfo");
      if (!userInfo) return;
      const parsed = JSON.parse(userInfo);
      if (!parsed?.token) {
        localStorage.removeItem("userInfo");
        setAuthToken(null);
      }
    } catch {
      localStorage.removeItem("userInfo");
      setAuthToken(null);
    }
  }, []);

  const login = async (credentials) => {
    const { data } = await loginAPI(credentials);
    if (!data?.token) throw new Error("Login response did not include a token");
    localStorage.setItem("userInfo", JSON.stringify(data));
    setAuthToken(data.token);
    setUser(data);
  };

  const register = async (credentials) => {
    const { data } = await registerAPI(credentials);
    if (!data?.token)
      throw new Error("Register response did not include a token");
    localStorage.setItem("userInfo", JSON.stringify(data));
    setAuthToken(data.token);
    setUser(data);
  };

  const logout = () => {
    localStorage.removeItem("userInfo");
    setAuthToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
