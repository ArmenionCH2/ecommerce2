import { createServerSupabase } from "@/app/lib/supabaseServer";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type Product = {
  id: string;
  title: string;
  description: string;
  price: string;
  stock: number;
};

export default async function ProductsPage() {
  const supabase = await createServerSupabase();
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;

  if (!userId) {
    return (
      <div className="page-container py-12">
        <div className="card p-8 text-center">
          <h1 className="text-3xl font-semibold text-slate-950">Seller access required</h1>
          <p className="mt-4 text-slate-600">Please log in as a seller to manage your products.</p>
        </div>
      </div>
    );
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).single();

  if (profile?.role !== "seller") {
    return (
      <div className="page-container py-12">
        <div className="card p-8 text-center">
          <h1 className="text-3xl font-semibold text-slate-950">Seller account required</h1>
          <p className="mt-4 text-slate-600">Only sellers can add and manage products.</p>
        </div>
      </div>
    );
  }

  const { data: productsData } = await supabase
    .from("products")
    .select("id,title,description,price,stock")
    .eq("seller_id", userId)
    .order("created_at", { ascending: false });

  const products = productsData ?? [];

  return (
    <section className="space-y-6">
      <div className="card overflow-hidden p-8">
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700">Seller products</p>
          <h1 className="text-3xl font-semibold text-slate-950">Manage your inventory</h1>
          <p className="text-slate-600">Add new products and keep your shop updated with clear seller controls.</p>
        </div>
        <form action={addProduct} className="mt-8 grid gap-4 sm:grid-cols-2">
          <input
            name="title"
            className="w-full rounded-3xl border border-emerald-200 bg-white/90 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            placeholder="Product title"
          />
          <input
            name="price"
            type="number"
            step="0.01"
            className="w-full rounded-3xl border border-emerald-200 bg-white/90 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            placeholder="Price"
          />
          <textarea
            name="description"
            className="col-span-full min-h-[120px] resize-none rounded-3xl border border-emerald-200 bg-white/90 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            placeholder="Description"
          />
          <input
            name="stock"
            type="number"
            min="0"
            className="w-full rounded-3xl border border-emerald-200 bg-white/90 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            placeholder="Stock"
          />
          <div className="col-span-full sm:col-auto">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition duration-200 hover:bg-emerald-700"
            >
              Add product
            </button>
          </div>
        </form>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {products.map((product) => (
          <div key={product.id} className="card p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-950">{product.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{product.description}</p>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-800">
                ${product.price}
              </span>
            </div>
            <div className="mt-4 flex items-center justify-between gap-3 text-sm text-slate-600">
              <p>Stock: {product.stock}</p>
              <form action={removeProduct} className="rounded-full bg-red-50 px-4 py-2">
                <input type="hidden" name="productId" value={product.id} />
                <button type="submit" className="text-red-700 hover:text-red-900">
                  Remove
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

async function addProduct(formData: FormData) {
  const title = (formData.get("title") as string)?.trim() ?? "";
  const description = (formData.get("description") as string)?.trim() ?? "";
  const price = parseFloat((formData.get("price") as string) ?? "0") || 0;
  const stock = parseInt((formData.get("stock") as string) ?? "0", 10) || 0;

  const supabase = await createServerSupabase();
  const { data: sessionData } = await supabase.auth.getSession();

  if (!sessionData.session) {
    return redirect("/auth/login");
  }

  const userId = sessionData.session.user.id;
  await supabase.from("products").insert({
    seller_id: userId,
    title,
    description,
    price,
    stock,
  });

  return redirect("/products");
}

async function removeProduct(formData: FormData) {
  const productId = (formData.get("productId") as string) ?? "";
  const supabase = await createServerSupabase();
  const { data: sessionData } = await supabase.auth.getSession();

  if (!sessionData.session) {
    return redirect("/auth/login");
  }

  const userId = sessionData.session.user.id;
  await supabase.from("products").delete().eq("id", productId).eq("seller_id", userId);

  return redirect("/products");
}
