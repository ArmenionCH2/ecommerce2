import { createServerSupabase } from "@/app/lib/supabaseServer";

export default async function DashboardPage() {
  const supabase = await createServerSupabase();
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;

  if (!userId) {
    return (
      <section className="space-y-6">
        <div className="card p-8 text-center">
          <h1 className="text-3xl font-semibold text-slate-950">Login to view the dashboard</h1>
          <p className="mt-4 text-slate-600">Seller dashboard metrics are powered by Supabase.</p>
        </div>
      </section>
    );
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).single();

  if (profile?.role !== "seller") {
    return (
      <section className="space-y-6">
        <div className="card p-8 text-center">
          <h1 className="text-3xl font-semibold text-slate-950">Seller account required</h1>
          <p className="mt-4 text-slate-600">Only sellers can view this dashboard.</p>
        </div>
      </section>
    );
  }

  const productsRes = await supabase.from("products").select("id").eq("seller_id", userId);
  const productCount = productsRes.data?.length ?? 0;

  const recentProductsRes = await supabase
    .from("products")
    .select("id,title,stock")
    .eq("seller_id", userId)
    .order("created_at", { ascending: false })
    .limit(3);

  const recentProducts = recentProductsRes.data ?? [];

  return (
    <section className="space-y-6">
      <div className="card overflow-hidden p-8">
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700">Seller dashboard</p>
          <h1 className="text-3xl font-semibold text-slate-950">Your store at a glance</h1>
          <p className="text-slate-600">Track inventory and recent listings from your seller account.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="card p-6">
          <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Products live</p>
          <p className="mt-3 text-4xl font-semibold text-slate-950">{productCount}</p>
          <p className="mt-2 text-sm text-slate-600">Your active product listings are visible to customers now.</p>
        </div>
        <div className="card p-6">
          <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Recent listings</p>
          <div className="mt-3 space-y-3 text-sm text-slate-600">
            {recentProducts.length === 0 ? (
              <p>No recent products yet.</p>
            ) : (
              recentProducts.map((product) => (
                <div key={product.id} className="rounded-3xl bg-emerald-50 p-3">
                  <p className="font-semibold text-slate-950">{product.title}</p>
                  <p>Stock: {product.stock}</p>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="card p-6">
          <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Store overview</p>
          <p className="mt-3 text-sm text-slate-600">This dashboard keeps your seller metrics connected to Supabase data.</p>
        </div>
      </div>
    </section>
  );
}
