"use server";

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "../lib/supabaseServer";

export async function registerAction(formData: FormData) {
  const email = (formData.get("email") as string)?.trim();
  const password = (formData.get("password") as string)?.trim();
  const fullName = (formData.get("fullName") as string)?.trim();
  const role = (formData.get("role") as string)?.trim();

  if (!email || !password || !fullName || !role) {
    return redirect("/auth/register?error=Please+complete+all+fields");
  }

  if (!["customer", "seller"].includes(role)) {
    return redirect("/auth/register?error=Invalid+role+selection");
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role,
      },
    },
  });

  if (error) {
    return redirect(`/auth/register?error=${encodeURIComponent(error.message)}`);
  }

  if (data.user?.id) {
    await supabase.from("profiles").insert([
      {
        id: data.user.id,
        email,
        full_name: fullName,
        role,
      },
    ]);
  }

  return redirect("/auth/login?registered=1");
}

export async function loginAction(formData: FormData) {
  const email = (formData.get("email") as string)?.trim();
  const password = (formData.get("password") as string)?.trim();
  const role = (formData.get("role") as string)?.trim();

  if (!email || !password || !role) {
    return redirect("/auth/login?error=Please+enter+email+password+and+role");
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.session?.user) {
    return redirect(`/auth/login?error=${encodeURIComponent(error?.message ?? "Login failed")}`);
  }

  const userId = data.session.user.id;
  const profileResponse = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (profileResponse.error || profileResponse.data?.role !== role) {
    await supabase.auth.signOut();
    return redirect(`/auth/login?error=${encodeURIComponent("Role+does+not+match+your+account")}`);
  }

  return redirect("/");
}
