import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "../lib/supabaseServer";
import { createProductAction } from "./actions";

type Product = {
  id: string;
  title: string;
  description: string | null;
  price: number;
  inventory: number;
  created_at: string | null;
};

export default async function ProductsPage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.user) {
    redirect("/auth/login");
  }

  const userId = session!.user.id;
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (profileError || profile?.role !== "seller") {
    redirect("/");
  }

  const { data: products } = await supabase
    .from("products")
    .select("id,title,description,price,inventory,created_at")
    .eq("seller_id", userId)
    .order("created_at", { ascending: false });

  return (
    <section className="space-y-6">
      <div className="card p-8">
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700">Seller products</p>
          <h1 className="text-3xl font-semibold text-slate-950">Your product catalog</h1>
          <p className="text-slate-600">Add new stock and manage the items you sell to customers.</p>
        </div>

        <form action={createProductAction} className="mt-8 grid gap-4 sm:grid-cols-2">
          <input type="text" name="title" placeholder="Product title" className="rounded-3xl border border-emerald-200 bg-white/90 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition duration-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" />
          <input type="number" name="price" min="0" step="0.01" placeholder="Price" className="rounded-3xl border border-emerald-200 bg-white/90 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition duration-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" />
          <input type="number" name="inventory" min="0" step="1" placeholder="Inventory" className="rounded-3xl border border-emerald-200 bg-white/90 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition duration-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" />
          <textarea name="description" placeholder="Description" className="min-h-[120px] rounded-3xl border border-emerald-200 bg-white/90 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition duration-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" />
          <button type="submit" className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition duration-200 hover:bg-emerald-700 sm:col-span-2">
            Add product
          </button>
        </form>
      </div>

      <div className="grid gap-4">
        {products?.length ? (
          products.map((product: Product) => (
            <div key={product.id} className="card p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-950">{product.title}</h2>
                  <p className="mt-2 text-slate-600">{product.description ?? "No additional details."}</p>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                  ${product.price.toFixed(2)}
                </span>
              </div>
              <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
                <span>Inventory: {product.inventory}</span>
                <span>Created {new Date(product.created_at ?? undefined).toLocaleDateString()}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="card p-8 text-slate-600">You have no products yet. Add a product using the form above to start selling.</div>
        )}
      </div>
    </section>
  );
}
