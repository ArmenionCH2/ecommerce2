import { createServerSupabase } from "./lib/supabaseServer";
import { redirect } from "next/navigation";

type Product = {
  id: string;
  title: string;
  description: string;
  price: string;
  stock: number;
};

export default async function Home({ searchParams }: { searchParams: { q?: string } }) {
  const supabase = await createServerSupabase();
  const query = searchParams.q?.trim() ?? "";
  let productsQuery = supabase
    .from("products")
    .select("id,title,description,price,stock")
    .order("created_at", { ascending: false });

  if (query) {
    productsQuery = productsQuery.ilike("title", `%${query}%`);
  }

  const { data: productsData } = await productsQuery;
  const products = productsData ?? [];

  return (
    <section className="space-y-8">
      <div className="card overflow-hidden p-8">
        <div className="max-w-2xl space-y-5">
          <p className="text-base font-semibold uppercase tracking-[0.25em] text-emerald-700">
            Fresh ecommerce
          </p>
          <h1 className="max-w-xl text-4xl font-semibold text-slate-950 sm:text-5xl">
            Discover fresh products, easy checkout, and clean customer flow.
          </h1>
          <p className="max-w-2xl text-base leading-8 text-slate-600">
            Browse the storefront, add items to your cart, and explore seller products in a polished modern interface.
          </p>
        </div>
        <form method="get" className="mt-8 grid gap-4 sm:grid-cols-[1fr_auto]">
          <input
            name="q"
            defaultValue={searchParams.q ?? ""}
            className="w-full rounded-3xl border border-emerald-200 bg-white/90 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            placeholder="Search products..."
          />
          <button
            type="submit"
            className="rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition duration-200 hover:bg-emerald-700"
          >
            Search
          </button>
        </form>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700">Marketplace</p>
            <h2 className="text-2xl font-semibold text-slate-950">Explore products from every seller</h2>
          </div>
          <p className="text-sm text-slate-600">Customer view with product cards and quick actions.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {products.length === 0 ? (
            <div className="col-span-full rounded-3xl border border-emerald-100 bg-white p-8 text-center text-slate-600 shadow-sm">
              No products found yet. Check back soon or ask a seller to add inventory.
            </div>
          ) : (
            products.map((product) => (
              <article key={product.id} className="card p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm uppercase tracking-[0.2em] text-slate-500">In stock</p>
                    <h3 className="mt-3 text-xl font-semibold text-slate-950">{product.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{product.description}</p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-800">
                    ${product.price}
                  </span>
                </div>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-sm text-slate-600">Stock: {product.stock}</span>
                  <form action={addToCart} className="flex items-center gap-2">
                    <input type="hidden" name="productId" value={product.id} />
                    <button
                      type="submit"
                      className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                    >
                      Add to cart
                    </button>
                  </form>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

async function addToCart(formData: FormData) {
  const productId = (formData.get("productId") as string) ?? "";
  const supabase = await createServerSupabase();
  const { data: sessionData } = await supabase.auth.getSession();

  if (!sessionData.session) {
    return redirect("/auth/login");
  }

  const userId = sessionData.session.user.id;
  const { data: existing } = await supabase
    .from("cart_items")
    .select("id,quantity")
    .eq("user_id", userId)
    .eq("product_id", productId)
    .single();

  if (existing) {
    await supabase
      .from("cart_items")
      .update({ quantity: existing.quantity + 1 })
      .eq("id", existing.id);
  } else {
    await supabase.from("cart_items").insert({
      user_id: userId,
      product_id: productId,
      quantity: 1,
    });
  }

  return redirect("/cart");
}
