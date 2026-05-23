"use client";

import { createClient } from "@/lib/supabase/client";
import type { Profile, UserRole } from "@/lib/types";
import type { SupabaseClient } from "@supabase/supabase-js";
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

async function fetchProfile(client: SupabaseClient, userId: string): Promise<AppUser | null> {
  try {
    const {
      data: { user: authUser },
      error: authError,
    } = await client.auth.getUser();

    if (authError || !authUser) return null;

    const { data, error } = await client.from("profiles").select("*").eq("id", userId).single();

    if (error || !data) return null;

    const synced = await syncRoleFromMetadata(
      client,
      userId,
      data as Profile,
      authUser.user_metadata
    );
    return profileToAppUser(synced);
  } catch (err) {
    console.error("[AuthProvider] fetchProfile failed:", err);
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const finishLoading = useCallback(() => {
    setLoading(false);
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const client = createClient();
      const {
        data: { session },
        error: sessionError,
      } = await client.auth.getSession();

      if (sessionError) {
        setAuthError(sessionError.message);
        setUser(null);
        return;
      }

      if (!session?.user) {
        setUser(null);
        setAuthError(null);
        return;
      }

      const appUser = await fetchProfile(client, session.user.id);
      setUser(appUser);
      setAuthError(
        appUser ? null : "Profile not found. Run green_market_schema.sql in Supabase."
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Auth refresh failed.";
      setAuthError(message);
      setUser(null);
      console.error("[AuthProvider] refreshProfile:", err);
    } finally {
      finishLoading();
    }
  }, [finishLoading]);

  useEffect(() => {
    let mounted = true;

    const safetyTimeout = setTimeout(() => {
      if (mounted) {
        console.warn("[AuthProvider] Auth init timed out — showing UI anyway.");
        finishLoading();
      }
    }, 8000);

    let client: SupabaseClient;
    try {
      client = createClient();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Supabase is not configured.";
      setAuthError(message);
      setUser(null);
      finishLoading();
      clearTimeout(safetyTimeout);
      return;
    }

    const applySession = async (userId: string | undefined) => {
      if (!mounted) return;
      if (!userId) {
        setUser(null);
        return;
      }
      const appUser = await fetchProfile(client, userId);
      setUser(appUser);
      if (!appUser) {
        setAuthError("Profile not found. Run green_market_schema.sql in Supabase.");
      } else {
        setAuthError(null);
      }
    };

    const bootstrap = async () => {
      try {
        const {
          data: { session },
        } = await client.auth.getSession();
        await applySession(session?.user?.id);
      } catch (err) {
        console.error("[AuthProvider] bootstrap failed:", err);
        if (mounted) {
          setAuthError(err instanceof Error ? err.message : "Failed to load session.");
          setUser(null);
        }
      } finally {
        if (mounted) finishLoading();
        clearTimeout(safetyTimeout);
      }
    };

    bootstrap();

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      try {
        await applySession(session?.user?.id);
      } catch (err) {
        console.error("[AuthProvider] onAuthStateChange:", err);
      } finally {
        if (mounted) finishLoading();
      }
    });

    return () => {
      mounted = false;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, [finishLoading]);

  const logout = async () => {
    try {
      const client = createClient();
      await client.auth.signOut();
    } catch (err) {
      console.error("[AuthProvider] logout:", err);
    } finally {
      setUser(null);
      setAuthError(null);
      finishLoading();
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
