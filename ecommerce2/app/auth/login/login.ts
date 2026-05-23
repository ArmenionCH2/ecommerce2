"use server";

import { createServerSupabase } from "@/app/lib/supabaseServer";
import { redirect } from "next/navigation";

export async function loginFunc(formData: FormData) {
  const email = (formData.get("email") as string)?.trim() ?? "";
  const password = (formData.get("password") as string) ?? "";

  if (!email || !password) {
    return redirect("/auth/login?error=Email and password are required");
  }

  try {
    const supabase = await createServerSupabase();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Login failed:", error.message);
      return redirect(
        `/auth/login?error=${encodeURIComponent("Login failed, check your credentials")}`
      );
    }

    return redirect(`/?message=${encodeURIComponent("Login successful")}`);
  } catch (error) {
    console.error("Unexpected login error:", error);
    return redirect(
      `/auth/login?error=${encodeURIComponent("Unable to login right now. Please try again later.")}`
    );
  }
}
