import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("claimassist_user");
    return raw ? JSON.parse(raw) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verifyToken() {
      const token = localStorage.getItem("claimassist_token");
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get("/auth/me");
        const u = res.data.data;
        localStorage.setItem("claimassist_user", JSON.stringify(u));
        setUser(u);
      } catch (err) {
        localStorage.removeItem("claimassist_token");
        localStorage.removeItem("claimassist_user");
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    verifyToken();
  }, []);

  async function login(email, password) {
    const res = await api.post("/auth/login", { email, password });
    const { token, user: u } = res.data.data;
    localStorage.setItem("claimassist_token", token);
    localStorage.setItem("claimassist_user", JSON.stringify(u));
    setUser(u);
    return u;
  }

  async function register(payload) {
    const res = await api.post("/auth/register", payload);
    const { token, user: u } = res.data.data;
    localStorage.setItem("claimassist_token", token);
    localStorage.setItem("claimassist_user", JSON.stringify(u));
    setUser(u);
    return u;
  }

  async function completeOAuth(token) {
    localStorage.setItem("claimassist_token", token);
    const res = await api.get("/auth/me");
    const u = res.data.data;
    localStorage.setItem("claimassist_user", JSON.stringify(u));
    setUser(u);
    return u;
  }

  function logout() {
    localStorage.removeItem("claimassist_token");
    localStorage.removeItem("claimassist_user");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, completeOAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
