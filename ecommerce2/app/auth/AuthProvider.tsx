"use client";

import { createClient } from "@/lib/supabase/client";
import type { Profile, UserRole } from "@/lib/types";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

export type AppUser = {
  id: string;
  email: string | null;
  role: UserRole;
  name: string | null;
};

type AuthContextType = {
  user: AppUser | null;
  loading: boolean;
  authError: string | null;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function profileToAppUser(profile: Profile): AppUser {
  return {
    id: profile.id,
    email: profile.email,
    role: profile.role,
    name: profile.store_name,
  };
}

async function syncRoleFromMetadata(
  client: SupabaseClient,
  userId: string,
  profile: Profile,
  metadata: Record<string, unknown> | undefined
): Promise<Profile> {
  const metaRole = metadata?.role;
  if (metaRole !== "merchant" && metaRole !== "customer") return profile;
  if (profile.role === metaRole) return profile;

  const { data, error } = await client
    .from("profiles")
    .update({ role: metaRole as UserRole })
    .eq("id", userId)
    .select()
    .single();

  if (error) return profile;
  return (data as Profile) ?? profile;
}

async function loadProfileFromSession(
  client: SupabaseClient,
  session: Session
): Promise<AppUser | null> {
  const userId = session.user.id;
  const { data, error } = await client.from("profiles").select("*").eq("id", userId).single();

  if (error || !data) return null;

  const synced = await syncRoleFromMetadata(
    client,
    userId,
    data as Profile,
    session.user.user_metadata
  );
  return profileToAppUser(synced);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const applySession = useCallback(async (session: Session | null) => {
    if (!session?.user) {
      setUser(null);
      setAuthError(null);
      return;
    }

    try {
      const client = createClient();
      const appUser = await loadProfileFromSession(client, session);
      setUser(appUser);
      setAuthError(
        appUser ? null : "Profile not found. Run green_market_schema.sql in Supabase."
      );
    } catch (err) {
      console.error("[AuthProvider] applySession:", err);
      setUser(null);
      setAuthError(err instanceof Error ? err.message : "Failed to load profile.");
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    setLoading(true);
    try {
      const client = createClient();
      const {
        data: { session },
        error,
      } = await client.auth.getSession();

      if (error) {
        setAuthError(error.message);
        setUser(null);
        return;
      }

      await applySession(session);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Auth refresh failed.");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [applySession]);

  useEffect(() => {
    let mounted = true;
    let client: SupabaseClient;

    try {
      client = createClient();
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Supabase is not configured.");
      setUser(null);
      setLoading(false);
      return;
    }

    // Do NOT call getSession() here — it deadlocks with onAuthStateChange when using SSR client.
    // INITIAL_SESSION delivers the session once the listener is registered.
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === "INITIAL_SESSION" || event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        await applySession(session);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setAuthError(null);
      }

      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [applySession]);

  const logout = async () => {
    try {
      const client = createClient();
      await client.auth.signOut();
    } catch (err) {
      console.error("[AuthProvider] logout:", err);
    } finally {
      setUser(null);
      setAuthError(null);
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, authError, logout, refreshProfile }}>
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
