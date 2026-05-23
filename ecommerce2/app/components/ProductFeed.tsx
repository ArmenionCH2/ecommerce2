import { getPublishedProducts } from "@/lib/products";
import ProductCard from "./ProductCard";

export default async function ProductFeed({ search }: { search?: string }) {
  const { products, error } = await getPublishedProducts(search);

  if (error) {
    return (
      <div className="card p-8">
        <p className="text-red-800">Could not load products.</p>
        <p className="mt-2 text-sm text-slate-600">{error.message}</p>
        <p className="mt-2 text-sm text-slate-500">
          Run <code className="rounded bg-slate-100 px-1">supabase/green_market_schema.sql</code> in
          your Supabase SQL editor.
        </p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="card p-8">
        <h2 className="text-xl font-semibold text-slate-950">No products yet</h2>
        <p className="mt-2 text-slate-600">
          Merchants can publish listings from their dashboard. Check back soon.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
