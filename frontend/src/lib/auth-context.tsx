import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { api, ApiRequestError } from "./api";

export type Role = "ADMIN" | "SALES" | "WAREHOUSE" | "ACCOUNTS";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

interface AuthContextValue {
  user: SessionUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("erp_token");
    if (!token) {
      setIsLoading(false);
      return;
    }
    api
      .get<{ user: SessionUser }>("/auth/me")
      .then((res) => setUser(res.user))
      .catch(() => localStorage.removeItem("erp_token"))
      .finally(() => setIsLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const res = await api.post<{ token: string; user: SessionUser }>("/auth/login", {
      email,
      password,
    });
    localStorage.setItem("erp_token", res.token);
    setUser(res.user);
  }

  function logout() {
    localStorage.removeItem("erp_token");
    setUser(null);
  }

  const value = useMemo(() => ({ user, isLoading, login, logout }), [user, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export { ApiRequestError };
