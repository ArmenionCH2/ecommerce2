import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "../../../lib/supabaseServer";

export async function GET() {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.auth.getSession();

  if (error || !data.session?.user) {
    return NextResponse.json({ user: null });
  }

  const userId = data.session.user.id;
  const { data: profile } = await supabase
    .from("profiles")
    .select("role,full_name")
    .eq("id", userId)
    .single();

  return NextResponse.json({
    user: {
      id: userId,
      email: data.session.user.email,
      role: profile?.role ?? null,
      fullName: profile?.full_name ?? null,
    },
  });
}
