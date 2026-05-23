import { createServerSupabase } from "@/app/lib/supabaseServer";
import { NextResponse } from "next/server";

export async function POST() {
  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Logout failed:", error.message);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
