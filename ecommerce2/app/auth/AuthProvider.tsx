"use client";

import { createClient } from "@/lib/supabase/client";
import type { Profile, UserRole } from "@/lib/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import React, { createContext, useContext, useEffect, useState } from "react";

type AuthContextType = {
  user: Profile | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function syncRoleFromMetadata(
  client: SupabaseClient,
  userId: string,
  profile: Profile,
  metadata: Record<string, unknown> | undefined
): Promise<Profile> {
  const metaRole = metadata?.role;
  if (metaRole !== "merchant" && metaRole !== "buyer") return profile;
  if (profile.role === metaRole) return profile;

  const { data } = await client
    .from("profiles")
    .update({ role: metaRole as UserRole })
    .eq("id", userId)
    .select()
    .single();

  return (data as Profile) ?? profile;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);

  const loadProfile = async (client: SupabaseClient, userId: string) => {
    const {
      data: { user: authUser },
    } = await client.auth.getUser();

    const { data } = await client.from("profiles").select("*").eq("id", userId).single();
    if (!data) {
      setUser(null);
      return;
    }

    const profile = await syncRoleFromMetadata(
      client,
      userId,
      data as Profile,
      authUser?.user_metadata
    );
    setUser(profile);
  };

  const refreshProfile = async () => {
    if (!supabase) return;
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      setUser(null);
      return;
    }

    await loadProfile(supabase, authUser.id);
  };

  useEffect(() => {
    const client = createClient();
    setSupabase(client);

    const init = async () => {
      const {
        data: { session },
      } = await client.auth.getSession();

      if (session?.user) {
        await loadProfile(client, session.user.id);
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    init();

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await loadProfile(client, session.user.id);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    if (supabase) await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, refreshProfile }}>
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
