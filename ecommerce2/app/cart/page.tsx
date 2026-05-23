export const dynamic = "force-dynamic";

import { getProfile, getSessionUser, isMerchant } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { CartItem, Product } from "@/lib/types";
import Link from "next/link";
import { redirect } from "next/navigation";
import { removeFromCart } from "./actions";

export default async function CartPage() {
  const profile = await getProfile();
  if (isMerchant(profile)) {
    redirect("/merchant/dashboard");
  }

  const user = await getSessionUser();

  if (!user) {
    return (
      <section className="space-y-6">
        <div className="card p-8">
          <h1 className="text-3xl font-semibold text-slate-950">Your cart</h1>
          <p className="mt-3 text-slate-600">
            <Link href="/auth/login" className="font-medium text-emerald-800 underline">
              Sign in
            </Link>{" "}
            as a customer to view your cart.
          </p>
        </div>
      </section>
    );
  }

  const supabase = await createClient();
  const { data: items } = await supabase
    .from("cart_items")
    .select("*, products(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const cart = (items ?? []) as CartItem[];
  const total = cart.reduce((sum, item) => {
    const price = item.products?.price ?? 0;
    return sum + Number(price) * item.quantity;
  }, 0);

  return (
    <section className="space-y-6">
      <div className="card p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700">Your cart</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">Manage your selections</h1>
      </div>

      {cart.length === 0 ? (
        <div className="card p-8">
          <p className="text-slate-600">Your cart is empty.</p>
          <Link href="/" className="mt-4 inline-block font-medium text-emerald-800 underline">
            Browse the feed
          </Link>
        </div>
      ) : (
        <>
          <ul className="grid gap-4">
            {cart.map((item) => {
              const product = item.products as Product | null;
              return (
                <li key={item.id} className="card flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-slate-950">{product?.name ?? "Product"}</h2>
                    <p className="text-sm text-slate-600">Qty: {item.quantity}</p>
                    <p className="mt-1 font-semibold text-emerald-800">
                      ${(Number(product?.price ?? 0) * item.quantity).toFixed(2)}
                    </p>
                  </div>
                  <form action={removeFromCart}>
                    <input type="hidden" name="cartItemId" value={item.id} />
                    <button
                      type="submit"
                      className="rounded-full bg-red-50 px-4 py-2 text-sm font-medium text-red-800 hover:bg-red-100"
                    >
                      Remove
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
          <div className="card p-8">
            <p className="text-lg font-semibold text-slate-950">
              Estimated total: <span className="text-emerald-800">${total.toFixed(2)}</span>
            </p>
          </div>
        </>
      )}
    </section>
  );
}
