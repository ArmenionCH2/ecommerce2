import { createServerSupabase } from "@/app/lib/supabaseServer";
import { redirect } from "next/navigation";

type OrderItem = {
  id: string;
  quantity: number;
  price: string;
  products: {
    title: string;
  }[] | null;
};

type Order = {
  id: string;
  status: string;
  total_amount: string;
  shipping_address: string;
  created_at: string;
  order_items: OrderItem[];
};

export default async function OrdersPage() {
  const supabase = await createServerSupabase();
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;

  if (!userId) {
    return (
      <section className="space-y-6">
        <div className="card p-8 text-center">
          <h1 className="text-3xl font-semibold text-slate-950">Login to view orders</h1>
          <p className="mt-4 text-slate-600">Your order history is stored in Supabase.</p>
        </div>
      </section>
    );
  }

  const { data: ordersData } = await supabase
    .from("orders")
    .select(
      "id,status,total_amount,shipping_address,created_at,order_items(id,quantity,price,products(id,title))"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const orders = (ordersData ?? []) as Order[];

  return (
    <section className="space-y-6">
      <div className="card p-8">
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700">Customer orders</p>
          <h1 className="text-3xl font-semibold text-slate-950">Track your purchases</h1>
          <p className="text-slate-600">Review past orders, check statuses, and cancel pending orders.</p>
        </div>
      </div>

      <div className="space-y-4">
        {orders.length === 0 ? (
          <div className="card p-8 text-center text-slate-600">
            You have no orders yet. Add items to your cart and checkout to create your first order.
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="card p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Order {order.id}</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950">${order.total_amount}</p>
                </div>
                <div className="space-y-1 text-right text-sm text-slate-600">
                  <p>{order.order_items.length} items</p>
                  <p>{order.status}</p>
                </div>
              </div>
              <div className="mt-5 space-y-4">
                <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-700">
                  <p className="font-semibold text-slate-950">Shipping address</p>
                  <p className="mt-2">{order.shipping_address}</p>
                </div>
                <div className="grid gap-3">
                  {order.order_items.map((item) => (
                    <div key={item.id} className="rounded-3xl border border-emerald-100 bg-white p-4 text-sm text-slate-700">
                      <p className="font-semibold text-slate-950">{item.products?.[0]?.title ?? "Product removed"}</p>
                      <p className="mt-1">Quantity: {item.quantity}</p>
                      <p>Price: ${item.price}</p>
                    </div>
                  ))}
                </div>
              </div>
              {order.status === "pending" ? (
                <form action={cancelOrder} className="mt-5 inline-flex">
                  <input type="hidden" name="orderId" value={order.id} />
                  <button className="rounded-full bg-amber-50 px-4 py-2 text-amber-800 hover:bg-amber-100" type="submit">
                    Cancel order
                  </button>
                </form>
              ) : null}
            </div>
          ))
        )}
      </div>
    </section>
  );
}

async function cancelOrder(formData: FormData) {
  const orderId = (formData.get("orderId") as string) ?? "";
  const supabase = await createServerSupabase();
  const { data: sessionData } = await supabase.auth.getSession();

  if (!sessionData.session) {
    return redirect("/auth/login");
  }

  const userId = sessionData.session.user.id;
  await supabase.from("orders").update({ status: "cancelled" }).eq("id", orderId).eq("user_id", userId);

  return redirect("/orders");
}
