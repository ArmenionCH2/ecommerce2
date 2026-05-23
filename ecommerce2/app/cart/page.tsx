import { createServerSupabase } from "@/app/lib/supabaseServer";
import { redirect } from "next/navigation";
import Button from "../components/button";
import Input from "../components/input";

type CartItem = {
  id: string;
  quantity: number;
  product_id: string;
  products: {
    title: string;
    price: string;
    stock: number;
  }[] | null;
};

export default async function CartPage() {
  const supabase = await createServerSupabase();
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;

  if (!userId) {
    return (
      <section className="space-y-6">
        <div className="card p-8 text-center">
          <h1 className="text-3xl font-semibold text-slate-950">Login to view your cart</h1>
          <p className="mt-4 text-slate-600">Your cart is saved in Supabase, not local storage.</p>
        </div>
      </section>
    );
  }

  const { data: cartItemsData } = await supabase
    .from("cart_items")
    .select("id,quantity,product_id,products(id,title,price,stock)")
    .eq("user_id", userId);

  const cartItems = (cartItemsData ?? []) as CartItem[];
  const total = cartItems.reduce(
    (sum, item) => sum + item.quantity * Number(item.products?.[0]?.price ?? 0),
    0
  );

  return (
    <section className="space-y-6">
      <div className="card p-8">
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700">Your cart</p>
          <h1 className="text-3xl font-semibold text-slate-950">Review your order</h1>
          <p className="text-slate-600">Manage quantities, select checkout details, and place an order with cash on delivery.</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_0.9fr]">
        <div className="card p-8">
          <h2 className="text-xl font-semibold text-slate-950">Cart items</h2>
          <div className="mt-6 space-y-4">
            {cartItems.length === 0 ? (
              <div className="rounded-3xl border border-emerald-100 bg-white p-8 text-center text-slate-600 shadow-sm">
                Your cart is empty. Add items from the marketplace to get started.
              </div>
            ) : (
              cartItems.map((item) => (
                <div key={item.id} className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-950">{item.products?.[0]?.title ?? "Deleted product"}</h3>
                      <p className="mt-1 text-sm text-slate-600">Price: ${item.products?.[0]?.price ?? "0.00"}</p>
                    </div>
                    <p className="text-lg font-semibold text-emerald-800">${(Number(item.products?.[0]?.price ?? 0) * item.quantity).toFixed(2)}</p>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
                    <p>Quantity: {item.quantity}</p>
                    <div className="flex items-center gap-2">
                      <form action={updateQuantity} className="inline-flex">
                        <input type="hidden" name="itemId" value={item.id} />
                        <input type="hidden" name="delta" value="-1" />
                        <button className="rounded-full border border-emerald-200 px-3 py-2 text-slate-700 hover:bg-emerald-50" type="submit">
                          -
                        </button>
                      </form>
                      <form action={updateQuantity} className="inline-flex">
                        <input type="hidden" name="itemId" value={item.id} />
                        <input type="hidden" name="delta" value="1" />
                        <button className="rounded-full border border-emerald-200 px-3 py-2 text-slate-700 hover:bg-emerald-50" type="submit">
                          +
                        </button>
                      </form>
                      <form action={removeItem} className="inline-flex">
                        <input type="hidden" name="itemId" value={item.id} />
                        <button className="rounded-full border border-red-200 px-3 py-2 text-red-700 hover:bg-red-50" type="submit">
                          Remove
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card p-8">
          <h2 className="text-xl font-semibold text-slate-950">Checkout details</h2>
          <p className="mt-2 text-sm text-slate-600">Confirm your address and place your order with cash on delivery.</p>

          <form action={checkout} className="mt-6 space-y-4">
            <Input type="text" name="address" placeholder="Delivery address" />
            <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-slate-700">
              <p className="font-semibold text-slate-950">Payment method</p>
              <p className="mt-2">Cash on delivery</p>
            </div>
            <div className="rounded-3xl border border-slate-100 bg-white p-4 text-sm text-slate-700">
              <p className="font-semibold text-slate-950">Order total</p>
              <p className="mt-2 text-xl font-semibold text-emerald-800">${total.toFixed(2)}</p>
            </div>
            <Button type="submit" text="Place order" />
          </form>
        </div>
      </div>
    </section>
  );
}

async function updateQuantity(formData: FormData) {
  const itemId = (formData.get("itemId") as string) ?? "";
  const delta = parseInt((formData.get("delta") as string) ?? "0", 10);
  const supabase = await createServerSupabase();
  const { data: sessionData } = await supabase.auth.getSession();

  if (!sessionData.session) {
    return redirect("/auth/login");
  }

  const userId = sessionData.session.user.id;
  const { data: item } = await supabase
    .from("cart_items")
    .select("quantity")
    .eq("id", itemId)
    .eq("user_id", userId)
    .single();

  if (!item) {
    return redirect("/cart");
  }

  const nextQuantity = item.quantity + delta;
  if (nextQuantity <= 0) {
    await supabase.from("cart_items").delete().eq("id", itemId).eq("user_id", userId);
  } else {
    await supabase.from("cart_items").update({ quantity: nextQuantity }).eq("id", itemId).eq("user_id", userId);
  }

  return redirect("/cart");
}

async function removeItem(formData: FormData) {
  const itemId = (formData.get("itemId") as string) ?? "";
  const supabase = await createServerSupabase();
  const { data: sessionData } = await supabase.auth.getSession();

  if (!sessionData.session) {
    return redirect("/auth/login");
  }

  const userId = sessionData.session.user.id;
  await supabase.from("cart_items").delete().eq("id", itemId).eq("user_id", userId);

  return redirect("/cart");
}

async function checkout(formData: FormData) {
  const address = (formData.get("address") as string)?.trim() ?? "";
  const supabase = await createServerSupabase();
  const { data: sessionData } = await supabase.auth.getSession();

  if (!sessionData.session) {
    return redirect("/auth/login");
  }

  const userId = sessionData.session.user.id;
  const { data: cartItems } = await supabase
    .from("cart_items")
    .select("product_id,quantity,products(id,title,price,stock)")
    .eq("user_id", userId);

  const items = cartItems ?? [];
  if (items.length === 0) {
    return redirect("/cart");
  }

  const total = items.reduce((sum, item) => sum + item.quantity * Number(item.products?.[0]?.price ?? 0), 0);
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      user_id: userId,
      status: "pending",
      total_amount: total,
      shipping_address: address,
      payment_method: "cash_on_delivery",
    })
    .select("id")
    .single();

  if (orderError || !order?.id) {
    return redirect("/cart");
  }

  const orderItems = items.map((item) => ({
    order_id: order.id,
    product_id: item.product_id,
    quantity: item.quantity,
    price: Number(item.products?.[0]?.price ?? 0),
  }));

  await supabase.from("order_items").insert(orderItems);
  await supabase.from("cart_items").delete().eq("user_id", userId);

  return redirect("/orders");
}
