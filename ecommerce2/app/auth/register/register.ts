"use server";

import { createServerSupabase } from "@/app/lib/supabaseServer";
import { redirect } from "next/navigation";

export async function registerFunc(formData: FormData) {
  const email = (formData.get("email") as string)?.trim() ?? "";
  const password = (formData.get("password") as string) ?? "";
  const role = (formData.get("role") as string) === "seller" ? "seller" : "customer";

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
    return redirect("/auth/login?error=Registration failed");
  }

  return redirect("/?message=Check your email to confirm registration");
}
