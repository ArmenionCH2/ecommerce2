import Link from "next/link";
import { createServerSupabaseClient } from "./lib/supabaseServer";

type Product = {
  id: string;
  title: string;
  description: string | null;
  price: number;
  inventory: number;
  seller: { full_name: string } | null;
};

async function getProducts(search?: string) {
  const supabase = createServerSupabaseClient();
  let query = supabase
    .from("products")
    .select("id,title,description,price,inventory,created_at,seller:profiles(full_name)")
    .order("created_at", { ascending: false });

  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
  }

  const { data } = await query;
  return (data ?? []) as Product[];
}

export default async function Home({ searchParams }: { searchParams: { search?: string } }) {
  const products = await getProducts(searchParams.search);

  return (
    <section className="space-y-8">
      <div className="card overflow-hidden p-8">
        <div className="max-w-2xl space-y-5">
          <p className="text-base font-semibold uppercase tracking-[0.25em] text-emerald-700">Fresh ecommerce</p>
          <h1 className="max-w-xl text-4xl font-semibold text-slate-950 sm:text-5xl">
            Discover a marketplace for customers and sellers.
          </h1>
          <p className="max-w-2xl text-base leading-8 text-slate-600">
            Browse products, manage your store, and enjoy clean, role-aware navigation with Supabase authentication.
          </p>
        </div>

        <form action="/" method="get" className="mt-8 grid gap-4 sm:grid-cols-[1fr_auto]">
          <input
            type="text"
            name="search"
            defaultValue={searchParams.search ?? ""}
            placeholder="Search products..."
            className="w-full rounded-3xl border border-emerald-200 bg-white/90 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition duration-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
          />
          <button className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition duration-200 hover:bg-emerald-700">
            Search
          </button>
        </form>
      </div>

      <div className="grid gap-4">
        {products.length ? (
          products.map((product) => (
            <div key={product.id} className="card p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-950">{product.title}</h2>
                  <p className="mt-2 text-slate-600">{product.description ?? "No description provided."}</p>
                </div>
                <div className="flex flex-col items-start gap-2 text-sm text-slate-600 sm:items-end">
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">${product.price.toFixed(2)}</span>
                  <span>Stock: {product.inventory}</span>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
                <span>Seller: {product.seller?.full_name ?? "Unknown"}</span>
                <Link href="/cart" className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-200">
                  View cart
                </Link>
              </div>
            </div>
          ))
        ) : (
          <div className="card p-8 text-slate-600">
            No products matched your search. Add new items from the seller dashboard or try a different term.
          </div>
        )}
      </div>
    </section>
  );
}
