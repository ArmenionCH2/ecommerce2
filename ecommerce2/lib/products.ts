import { createClient } from "@/lib/supabase/server";
import type { Product, Profile } from "@/lib/types";

export async function getPublishedProducts(search?: string) {
  const supabase = await createClient();

  let query = supabase
    .from("products")
    .select("*")
    .eq("published", true)
    .order("created_at", { ascending: false });

  if (search?.trim()) {
    const term = search.trim();
    query = query.or(`name.ilike.%${term}%,description.ilike.%${term}%`);
  }

  const { data: products, error } = await query;
  if (error) return { products: [] as Product[], error };

  const list = (products ?? []) as Product[];
  const merchantIds = [...new Set(list.map((p) => p.merchant_id))];

  if (merchantIds.length === 0) {
    return { products: list, error: null };
  }

  const { data: merchants } = await supabase
    .from("profiles")
    .select("id, store_name, email")
    .in("id", merchantIds);

  const byId = new Map(
    ((merchants ?? []) as Pick<Profile, "id" | "store_name" | "email">[]).map((m) => [
      m.id,
      m,
    ])
  );

  return {
    products: list.map((p) => ({
      ...p,
      merchant: byId.get(p.merchant_id) ?? null,
    })),
    error: null,
  };
}

export async function getMerchantProducts(merchantId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("merchant_id", merchantId)
    .order("created_at", { ascending: false });

  return { products: (data ?? []) as Product[], error };
}
