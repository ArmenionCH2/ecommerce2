"use server";

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "../lib/supabaseServer";

export async function createProductAction(formData: FormData) {
  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim();
  const price = parseFloat((formData.get("price") as string) ?? "0");
  const inventory = parseInt((formData.get("inventory") as string) ?? "0", 10);

  if (!title || !price || inventory < 0) {
    return redirect("/products?error=Please+provide+a+valid+product+title,+price+and+inventory");
  }

  const supabase = createServerSupabaseClient();
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.user) {
    return redirect("/auth/login");
  }

  const userId = session.user.id;
  const profileResponse = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (profileResponse.error || profileResponse.data?.role !== "seller") {
    return redirect("/");
  }

  await supabase.from("products").insert([
    {
      seller_id: userId,
      title,
      description,
      price,
      inventory,
    },
  ]);

  return redirect("/products");
}
