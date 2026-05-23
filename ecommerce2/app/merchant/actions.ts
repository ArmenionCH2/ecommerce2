"use server";

import { getProfile, isMerchant } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createProduct(formData: FormData) {
  const profile = await getProfile();
  if (!profile || !isMerchant(profile)) redirect("/auth/login?error=Merchant account required");

  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim();
  const price = parseFloat(formData.get("price") as string);
  const image_url = (formData.get("image_url") as string)?.trim() || null;
  const published = formData.get("published") === "on";

  if (!title || Number.isNaN(price) || price < 0) {
    redirect("/merchant/products/new?error=Invalid product details");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("products").insert({
    merchant_id: profile.id,
    title,
    description: description ?? "",
    price,
    image_url,
    published,
  });

  if (error) {
    console.error(error.message);
    redirect("/merchant/products/new?error=Could not save product");
  }

  revalidatePath("/");
  revalidatePath("/merchant");
  redirect("/merchant");
}

export async function deleteProduct(formData: FormData) {
  const profile = await getProfile();
  if (!profile || !isMerchant(profile)) redirect("/auth/login");

  const productId = formData.get("productId") as string;
  const supabase = await createClient();

  await supabase.from("products").delete().eq("id", productId).eq("merchant_id", profile.id);

  revalidatePath("/");
  revalidatePath("/merchant");
  redirect("/merchant");
}

export async function togglePublish(formData: FormData) {
  const profile = await getProfile();
  if (!profile || !isMerchant(profile)) redirect("/auth/login");

  const productId = formData.get("productId") as string;
  const published = formData.get("published") === "true";

  const supabase = await createClient();
  await supabase
    .from("products")
    .update({ published: !published })
    .eq("id", productId)
    .eq("merchant_id", profile.id);

  revalidatePath("/");
  revalidatePath("/merchant");
  redirect("/merchant");
}
