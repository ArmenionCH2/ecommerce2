import { createServerSupabase } from "@/app/lib/supabaseServer";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createServerSupabase();
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !sessionData.session) {
    return NextResponse.json({ user: null });
  }

  const { data: profileData } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", sessionData.session.user.id)
    .single();

  return NextResponse.json({
    user: {
      id: sessionData.session.user.id,
      email: sessionData.session.user.email,
      role: profileData?.role ?? "customer",
    },
  });
}
