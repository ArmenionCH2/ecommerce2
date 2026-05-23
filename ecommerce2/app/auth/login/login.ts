"use server";

import { createServerSupabase } from "@/app/lib/supabaseServer";
import { redirect } from "next/navigation";

export async function loginFunc(formData: FormData) {
  const email = (formData.get("email") as string)?.trim() ?? "";
  const password = (formData.get("password") as string) ?? "";

  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("Login failed:", error.message);
    return redirect("/auth/login?error=Login failed, check your credentials");
  }

  return redirect("/");
}
