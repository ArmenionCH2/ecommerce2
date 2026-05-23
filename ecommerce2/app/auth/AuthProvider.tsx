"use client";

import { createClient } from "@/lib/supabase/client";
import type { Profile, UserRole } from "@/lib/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import React, { createContext, useContext, useEffect, useState } from "react";

export type AppUser = {
  id: string;
  email: string | null;
  role: UserRole;
  name: string | null;
};

type AuthContextType = {
  user: AppUser | null;
  loading: boolean;
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

  const { data } = await client
    .from("profiles")
    .update({ role: metaRole as UserRole })
    .eq("id", userId)
    .select()
    .single();

  return (data as Profile) ?? profile;
}

async function fetchProfile(client: SupabaseClient, userId: string) {
  const {
    data: { user: authUser },
  } = await client.auth.getUser();

  const { data, error } = await client.from("profiles").select("*").eq("id", userId).single();

  if (error || !data) return null;

  const synced = await syncRoleFromMetadata(
    client,
    userId,
    data as Profile,
    authUser?.user_metadata
  );
  return profileToAppUser(synced);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);

  const refreshProfile = async () => {
    if (!supabase) return;
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (!authUser) {
      setUser(null);
      return;
    }
    const appUser = await fetchProfile(supabase, authUser.id);
    setUser(appUser);
  };

  useEffect(() => {
    const client = createClient();
    setSupabase(client);

    const init = async () => {
      const {
        data: { session },
      } = await client.auth.getSession();

      if (session?.user) {
        const appUser = await fetchProfile(client, session.user.id);
        setUser(appUser);
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
        const appUser = await fetchProfile(client, session.user.id);
        setUser(appUser);
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
