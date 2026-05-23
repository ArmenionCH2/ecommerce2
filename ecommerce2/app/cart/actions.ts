"use server";

import { getSessionUser, getProfile, isMerchant } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function addToCart(formData: FormData) {
  const profile = await getProfile();
  if (!profile || isMerchant(profile)) {
    redirect("/auth/login?error=Sign in as a customer to add items to your cart");
  }

  const productId = formData.get("productId") as string;
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("cart_items")
    .select("id, quantity")
    .eq("user_id", profile.id)
    .eq("product_id", productId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("cart_items")
      .update({ quantity: existing.quantity + 1 })
      .eq("id", existing.id);
  } else {
    await supabase.from("cart_items").insert({
      user_id: profile.id,
      product_id: productId,
      quantity: 1,
    });
  }

  revalidatePath("/cart");
  redirect("/cart");
}

export async function removeFromCart(formData: FormData) {
  const user = await getSessionUser();
  if (!user) redirect("/auth/login");

  const cartItemId = formData.get("cartItemId") as string;
  const supabase = await createClient();

  await supabase.from("cart_items").delete().eq("id", cartItemId).eq("user_id", user.id);

  revalidatePath("/cart");
  redirect("/cart");
}
