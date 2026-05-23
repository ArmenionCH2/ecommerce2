import { createClient } from "@/lib/supabase/server";
import type { Product, Profile } from "@/lib/types";

/** Load published feed without PostgREST embed (avoids schema-cache relationship errors). */
export async function getPublishedProducts(search?: string) {
  const supabase = await createClient();

  let query = supabase
    .from("products")
    .select("*")
    .eq("published", true)
    .order("created_at", { ascending: false });

  if (search?.trim()) {
    query = query.or(
      `title.ilike.%${search.trim()}%,description.ilike.%${search.trim()}%`
    );
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
    .select("id, full_name, email")
    .in("id", merchantIds);

  const byId = new Map(
    ((merchants ?? []) as Pick<Profile, "id" | "full_name" | "email">[]).map((m) => [m.id, m])
  );

  const withMerchants = list.map((product) => ({
    ...product,
    profiles: byId.get(product.merchant_id) ?? null,
  }));

  return { products: withMerchants, error: null };
}
