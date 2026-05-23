"use server";

import { createServerSupabase } from "@/app/lib/supabaseServer";
import { redirect } from "next/navigation";

export async function registerFunc(formData: FormData) {
  const email = (formData.get("email") as string)?.trim() ?? "";
  const password = (formData.get("password") as string) ?? "";
  const role = (formData.get("role") as string) === "seller" ? "seller" : "customer";

  if (!email || !password) {
    return redirect("/auth/register?error=Email and password are required");
  }

  try {
    const supabase = await createServerSupabase();

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role,
        },
      },
    });

    if (error) {
      console.error("Signup failed:", error.message);
      return redirect(
        `/auth/register?error=${encodeURIComponent("Registration failed, please try again")}`
      );
    }

    return redirect(
      `/?message=${encodeURIComponent("Check your email to confirm registration")}`
    );
  } catch (error) {
    console.error("Unexpected signup error:", error);
    return redirect(
      `/auth/register?error=${encodeURIComponent("Unable to register right now. Please try again later.")}`
    );
  }
}
