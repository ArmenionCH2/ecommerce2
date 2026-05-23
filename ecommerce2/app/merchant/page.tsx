export const dynamic = "force-dynamic";

import Link from "next/link";
import { getProfile, isMerchant } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { deleteProduct, togglePublish } from "./actions";
import type { Product } from "@/lib/types";

export default async function MerchantDashboardPage() {
  const profile = await getProfile();
  if (!profile) {
    redirect("/auth/login?error=Sign in with a merchant account");
  }

  if (!isMerchant(profile)) {
    redirect("/?message=This area is for merchant accounts only");
  }

  const supabase = await createClient();
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("merchant_id", profile.id)
    .order("created_at", { ascending: false });

  const list = (products ?? []) as Product[];

  return (
    <section className="space-y-6">
      <div className="card flex flex-col gap-4 p-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700">
            Merchant dashboard
          </p>
          <h1 className="text-3xl font-semibold text-slate-950">Your products</h1>
          <p className="text-slate-600">
            Add and publish listings here. Buyers see published items on the public feed — you do
            not use the cart or shopper feed.
          </p>
        </div>
        <Link
          href="/merchant/products/new"
          className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700"
        >
          + Add product
        </Link>
      </div>

      {list.length === 0 ? (
        <div className="card space-y-4 p-8">
          <p className="text-slate-600">No products yet.</p>
          <Link
            href="/merchant/products/new"
            className="inline-flex rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Create your first product
          </Link>
        </div>
      ) : (
        <ul className="grid gap-4">
          {list.map((product) => (
            <li key={product.id} className="card flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
              <div className="flex-1 space-y-1">
                <h2 className="text-xl font-semibold text-slate-950">{product.title}</h2>
                <p className="line-clamp-2 text-sm text-slate-600">{product.description}</p>
                <p className="text-lg font-semibold text-emerald-800">
                  ${Number(product.price).toFixed(2)}
                  <span className="ml-3 text-sm font-normal text-slate-500">
                    {product.published ? "Published" : "Draft"}
                  </span>
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <form action={togglePublish}>
                  <input type="hidden" name="productId" value={product.id} />
                  <input type="hidden" name="published" value={String(product.published)} />
                  <button
                    type="submit"
                    className="rounded-full border border-emerald-200 px-4 py-2 text-sm font-medium text-emerald-900 hover:bg-emerald-50"
                  >
                    {product.published ? "Unpublish" : "Publish"}
                  </button>
                </form>
                <form action={deleteProduct}>
                  <input type="hidden" name="productId" value={product.id} />
                  <button
                    type="submit"
                    className="rounded-full bg-red-50 px-4 py-2 text-sm font-medium text-red-800 hover:bg-red-100"
                  >
                    Delete
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
