import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/lib/types";
import ProductCard from "./ProductCard";

export default async function ProductFeed({ search }: { search?: string }) {
  const supabase = await createClient();

  let query = supabase
    .from("products")
    .select("*, profiles(full_name, email)")
    .eq("published", true)
    .order("created_at", { ascending: false });

  if (search?.trim()) {
    query = query.or(`title.ilike.%${search.trim()}%,description.ilike.%${search.trim()}%`);
  }

  const { data: products, error } = await query;

  if (error) {
    return (
      <div className="card p-8">
        <p className="text-red-800">
          Could not load products. Make sure Supabase is configured and migrations are applied.
        </p>
        <p className="mt-2 text-sm text-slate-600">{error.message}</p>
      </div>
    );
  }

  const list = (products ?? []) as Product[];

  if (list.length === 0) {
    return (
      <div className="card p-8">
        <h2 className="text-xl font-semibold text-slate-950">No products yet</h2>
        <p className="mt-2 text-slate-600">
          Merchants can post listings from the merchant dashboard. They will appear here for all
          shoppers.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {list.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
