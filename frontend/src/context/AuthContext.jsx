import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "@/lib/axios";

const AuthContext = createContext(null);

const TOKEN_KEY = "todox_token";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(token));

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      if (!token) {
        setLoading(false);
        setUser(null);
        return;
      }

      try {
        const res = await api.get("/auth/me");
        if (!cancelled) setUser(res.data.user);
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        if (!cancelled) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const value = useMemo(() => {
    return {
      token,
      user,
      loading,
      isAuthed: Boolean(token && user),
      async login({ email, password }) {
        const res = await api.post("/auth/login", { email, password });
        localStorage.setItem(TOKEN_KEY, res.data.token);
        setToken(res.data.token);
        setUser(res.data.user);
        return res.data.user;
      },
      async register({ name, email, password }) {
        const res = await api.post("/auth/register", { name, email, password });
        localStorage.setItem(TOKEN_KEY, res.data.token);
        setToken(res.data.token);
        setUser(res.data.user);
        return res.data.user;
      },
      logout() {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
      },
    };
  }, [token, user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

