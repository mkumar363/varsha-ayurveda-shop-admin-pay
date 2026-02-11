import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { User } from "../types";
import { login as apiLogin, logout as apiLogout, me as apiMe, setToken as apiSetToken, signup as apiSignup, getToken } from "../api";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getToken());
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  async function loadMe() {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await apiMe();
      setUser(res.user);
    } catch {
      // token is invalid/expired
      apiSetToken(null);
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const value = useMemo<AuthContextValue>(() => {
    return {
      user,
      token,
      loading,
      async login(email, password) {
        const res = await apiLogin({ email, password });
        apiSetToken(res.token);
        setToken(res.token);
        setUser(res.user);
      },
      async signup(name, email, password) {
        const res = await apiSignup({ name, email, password });
        apiSetToken(res.token);
        setToken(res.token);
        setUser(res.user);
      },
      async logout() {
        try {
          await apiLogout();
        } catch {
          // ignore network errors
        } finally {
          apiSetToken(null);
          setToken(null);
          setUser(null);
        }
      },
    };
  }, [user, token, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
