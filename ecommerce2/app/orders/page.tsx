"use client";

import { useAuth } from "../auth/AuthProvider";
import Link from "next/link";

export default function OrdersPage() {
  const { mockRole, orders, cancelOrder } = useAuth();

  // Access check
  if (mockRole !== "customer") {
    return (
      <div className="card max-w-lg mx-auto p-8 text-center space-y-6 bg-white/90 shadow-xl border border-rose-100">
        <div className="mx-auto w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center text-rose-600 text-xl">
          🚫
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Access Denied</h1>
        <p className="text-sm text-slate-500">
          Order tracking is reserved for Customers. Switch your role to "Customer" using the toolbar at the bottom right to view your orders.
        </p>
        <Link href="/" className="inline-block rounded-full bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700">
          Go back to store
        </Link>
      </div>
    );
  }

  const handleCancelClick = (orderId: string) => {
    if (confirm("Are you sure you want to cancel this order? This will restock the inventory.")) {
      cancelOrder(orderId);
    }
  };

  return (
    <section className="space-y-8">
      {/* Page Header */}
      <div className="card p-6 md:p-8 bg-white/80 backdrop-blur shadow-sm border border-emerald-50/50">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-700">Purchase History</p>
        <h1 className="text-3xl font-extrabold text-slate-900">Track Your Orders</h1>
        <p className="text-slate-500 text-sm">Monitor order shipment progress or cancel pending Cash on Delivery orders.</p>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Your Orders ({orders.length})</h2>

        {orders.length === 0 ? (
          <div className="card p-12 text-center max-w-md mx-auto space-y-4 bg-white/60">
            <div className="text-4xl">📦</div>
            <h3 className="text-lg font-bold text-slate-950">No orders placed yet</h3>
            <p className="text-sm text-slate-500">
              You haven't purchased anything yet. Explore our fresh catalogs and add items to your cart!
            </p>
            <Link href="/" className="inline-block rounded-full bg-emerald-600 px-5 py-2 text-xs font-semibold text-white hover:bg-emerald-700">
              Shop Now
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div
                key={order.id}
                className="card p-6 bg-white/95 border border-slate-100 flex flex-col md:flex-row md:items-start justify-between gap-6 transition hover:shadow-md"
              >
                {/* Details / Summary */}
                <div className="flex-1 space-y-4">
                  {/* Order ID & Date Header */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider bg-slate-100 px-2.5 py-1 rounded-lg">
                      Order: {order.id.slice(-6).toUpperCase()}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">{order.date}</span>
                    
                    {/* Status Badge */}
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ml-2 ${
                        order.status === "Pending"
                          ? "bg-amber-100 text-amber-800"
                          : order.status === "Shipped"
                          ? "bg-blue-100 text-blue-800"
                          : order.status === "Delivered"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {order.status === "Pending" ? "Awaiting Shipment" : order.status}
                    </span>
                  </div>

                  {/* Order items breakdown */}
                  <div className="space-y-2 border-l-2 border-slate-100 pl-3">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="text-xs text-slate-700 flex justify-between max-w-sm">
                        <span>
                          {item.title} <span className="text-slate-400">x{item.quantity}</span>
                        </span>
                        <span className="font-semibold text-slate-900">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <hr className="border-slate-100 max-w-sm" />

                  {/* Delivery Location & Payment Method */}
                  <div className="space-y-1 text-xs text-slate-600">
                    <div>
                      📍 <strong>Ship to:</strong> {order.deliveryLocation}
                    </div>
                    <div>
                      💵 <strong>Payment:</strong> {order.paymentMethod}
                    </div>
                  </div>
                </div>

                {/* Totals & Cancel Actions */}
                <div className="flex flex-col items-end justify-between self-stretch gap-4 border-t pt-4 md:border-t-0 md:pt-0 md:pl-4">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                      Order Grand Total
                    </span>
                    <span className="text-xl font-black text-emerald-800">
                      ${order.totalPrice.toFixed(2)}
                    </span>
                  </div>

                  {/* Cancel Actions */}
                  {order.status === "Pending" ? (
                    <button
                      onClick={() => handleCancelClick(order.id)}
                      className="rounded-full bg-rose-50 hover:bg-rose-100 px-5 py-2 text-xs font-bold text-rose-700 transition"
                    >
                      Cancel Order ✕
                    </button>
                  ) : order.status === "Cancelled" ? (
                    <span className="text-xs font-bold text-rose-500">
                      Order Cancelled
                    </span>
                  ) : order.status === "Shipped" ? (
                    <span className="text-xs font-bold text-slate-500">
                      Item on the way 🚚
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-emerald-600">
                      Delivered ✓
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
