"use client";

import { createContext, useContext, useEffect, useState } from "react";

type UserRole = "guest" | "customer" | "seller";

type User = {
  id?: string;
  email?: string;
  role?: UserRole;
};

type AuthContextType = {
  user: User | null;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    async function loadSession() {
      try {
        const response = await fetch("/api/auth/session");
        if (!response.ok) {
          setUser(null);
          return;
        }
        const data = await response.json();
        setUser(data.user);
      } catch {
        setUser(null);
      }
    }

    loadSession();
  }, []);

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export default AuthProvider;
