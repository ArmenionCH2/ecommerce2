import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "../lib/supabaseServer";

export default async function DashboardPage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.user) {
    redirect("/auth/login");
  }

  const userId = session.user.id;
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role,full_name")
    .eq("id", userId)
    .single();

  if (profileError || profile?.role !== "seller") {
    redirect("/");
  }

  const { data: products } = await supabase
    .from("products")
    .select("id,price,inventory")
    .eq("seller_id", userId);

  const totalProducts = products?.length ?? 0;
  const totalInventory = products?.reduce((sum, item) => sum + (item.inventory ?? 0), 0) ?? 0;

  return (
    <section className="space-y-6">
      <div className="card p-8">
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700">Seller dashboard</p>
          <h1 className="text-3xl font-semibold text-slate-950">Insights for your store</h1>
          <p className="text-slate-600">A simple dashboard showing your live product count and inventory.</p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-6">
            <p className="text-sm uppercase tracking-[0.25em] text-emerald-700">Products listed</p>
            <p className="mt-4 text-4xl font-semibold text-slate-950">{totalProducts}</p>
          </div>
          <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-6">
            <p className="text-sm uppercase tracking-[0.25em] text-emerald-700">Total inventory</p>
            <p className="mt-4 text-4xl font-semibold text-slate-950">{totalInventory}</p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/products" className="rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700">
            Manage products
          </Link>
          <Link href="/" className="rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
            View store
          </Link>
        </div>
      </div>
    </section>
  );
}
