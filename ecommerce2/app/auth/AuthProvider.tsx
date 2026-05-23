"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

type UserRole = "guest" | "customer" | "seller";

type AuthUser = {
  id: string;
  email: string | null;
  role: UserRole;
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSession() {
      try {
        const response = await fetch("/api/auth/session");
        if (!response.ok) {
          setUser(null);
          return;
        }

        const body = await response.json();
        setUser(body?.user ?? null);
      } catch (error) {
        console.error("Failed to load auth session", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    fetchSession();
  }, []);

  const logout = useMemo(
    () => async () => {
      try {
        await fetch("/api/auth/logout", { method: "POST" });
        setUser(null);
      } catch (error) {
        console.error("Logout failed", error);
      }
    },
    []
  );

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

