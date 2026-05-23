import { createClient } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/lib/types";

function roleFromMetadata(metadata: Record<string, unknown> | undefined): UserRole | null {
  const role = metadata?.role;
  if (role === "merchant" || role === "customer") return role;
  return null;
}

async function syncProfileRole(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  profile: Profile,
  metadata: Record<string, unknown> | undefined
): Promise<Profile> {
  const metaRole = roleFromMetadata(metadata);
  if (!metaRole || profile.role === metaRole) return profile;

  const { data } = await supabase
    .from("profiles")
    .update({ role: metaRole })
    .eq("id", userId)
    .select()
    .single();

  return (data as Profile) ?? profile;
}

export async function getSessionUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  return syncProfileRole(supabase, user.id, profile as Profile, user.user_metadata);
}

export function isMerchant(profile: Profile | null | undefined) {
  return profile?.role === "merchant";
}
