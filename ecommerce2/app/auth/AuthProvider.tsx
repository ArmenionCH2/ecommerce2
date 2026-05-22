"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type User = {
  name?: string;
  email?: string;
  role?: "customer" | "merchant";
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
      // ignore
    }
  }, []);

  const login = (u: User) => {
    setUser(u);
    try {
      localStorage.setItem("gm_user", JSON.stringify(u));
    } catch {}
  };

  const register = (u: User) => {
    // mirror login behaviour for client-side registration success
    login(u);
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem("gm_user");
    } catch {}
  };

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
