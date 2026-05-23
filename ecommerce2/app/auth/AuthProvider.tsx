"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type User = {
  name?: string;
  email?: string;
  role?: "customer" | "seller";
};

type AuthContextType = {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  register: (user: User) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("gm_user");
      if (raw) setUser(JSON.parse(raw));
    } catch (e) {
      // ignore invalid state
    }
  }, []);

  const persistUser = (u: User | null) => {
    setUser(u);
    try {
      if (u) {
        localStorage.setItem("gm_user", JSON.stringify(u));
      } else {
        localStorage.removeItem("gm_user");
      }
    } catch {
      // ignore storage failures
    }
  };

  const login = (u: User) => persistUser(u);
  const register = (u: User) => persistUser(u);
  const logout = () => persistUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout, register }}>
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
