"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { UserRole } from "@/lib/types";

export async function registerFunc(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const role = (formData.get("role") as UserRole) || "buyer";

  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { role },
    },
  });

  if (error) {
    console.error("Signup failed:", error.message);
    return redirect("/auth/register?error=Registration failed");
  }

  return redirect("/auth/login?message=Account created. Sign in to continue.");
}
