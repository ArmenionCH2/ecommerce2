"use client";

import { useAuth } from "../auth/AuthProvider";
import Link from "next/link";

export default function DashboardPage() {
  const { user, mockRole, products, orders, sellerShipOrder, sellerDeliverOrder } = useAuth();

  // Access check
  if (mockRole !== "seller") {
    return (
      <div className="card max-w-lg mx-auto p-8 text-center space-y-6 bg-white/90 shadow-xl border border-rose-100">
        <div className="mx-auto w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center text-rose-600 text-xl">
          🚫
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Access Denied</h1>
        <p className="text-sm text-slate-500">
          This dashboard is reserved for Sellers only. Switch your role to "Seller" using the toolbar at the bottom right to view this page.
        </p>
        <Link href="/" className="inline-block rounded-full bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700">
          Go back to store
        </Link>
      </div>
    );
  }

  // Calculate statistics for this seller (seller-1)
  const sellerProducts = products.filter((p) => p.sellerId === user?.id || p.sellerId === "seller-1");
  const sellerProductIds = new Set(sellerProducts.map((p) => p.id));

  // Find orders containing this seller's products
  const sellerOrders = orders.filter((o) =>
    o.items.some((item) => sellerProductIds.has(item.productId))
  );

  // Calculate revenue for this seller
  let totalRevenue = 0;
  let pendingFulfillment = 0;
  let completedOrders = 0;

  sellerOrders.forEach((order) => {
    if (order.status === "Cancelled") return;
    
    // Sum only the items belonging to this seller
    const orderSellerTotal = order.items
      .filter((item) => sellerProductIds.has(item.productId))
      .reduce((sum, item) => sum + item.price * item.quantity, 0);

    totalRevenue += orderSellerTotal;

    if (order.status === "Pending" || order.status === "Shipped") {
      pendingFulfillment++;
    } else if (order.status === "Delivered") {
      completedOrders++;
    }
  });

  return (
    <section className="space-y-8">
      {/* Dashboard Header */}
      <div className="card p-6 md:p-8 bg-white/80 backdrop-blur shadow-sm border border-emerald-50/50">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-indigo-600">Operations Control</p>
        <h1 className="text-3xl font-extrabold text-slate-900">Merchant Dashboard</h1>
        <p className="text-slate-500 text-sm">Monitor your store performance, analyze earnings, and process orders.</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Metric 1: Revenue */}
        <div className="card p-6 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-600/10 border-none">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-200">Total Sales Revenue</span>
          <h3 className="text-3xl font-black mt-2">${totalRevenue.toFixed(2)}</h3>
          <p className="text-indigo-100 text-xs mt-2">Earned from customer orders</p>
        </div>

        {/* Metric 2: Active Products */}
        <div className="card p-6 bg-white border border-slate-100">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Active Listings</span>
          <h3 className="text-3xl font-extrabold text-slate-900 mt-2">{sellerProducts.length}</h3>
          <p className="text-slate-500 text-xs mt-2">Products visible in store</p>
        </div>

        {/* Metric 3: Pending Shipment */}
        <div className="card p-6 bg-white border border-slate-100">
          <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600">Awaiting Shipment</span>
          <h3 className="text-3xl font-extrabold text-slate-900 mt-2">{pendingFulfillment}</h3>
          <p className="text-slate-500 text-xs mt-2">Requires merchant action</p>
        </div>

        {/* Metric 4: Success Orders */}
        <div className="card p-6 bg-white border border-slate-100">
          <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">Completed Orders</span>
          <h3 className="text-3xl font-extrabold text-slate-900 mt-2">{completedOrders}</h3>
          <p className="text-slate-500 text-xs mt-2">Delivered to customers</p>
        </div>
      </div>

      {/* Chart Section */}
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="card p-6 bg-white border border-slate-100 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-900">Weekly Earnings</h3>
              <p className="text-xs text-slate-500">Sales performance over the past 7 days</p>
            </div>
            <span className="text-xs font-semibold text-indigo-600 rounded-full bg-indigo-50 px-3 py-1">
              Active Session
            </span>
          </div>

          {/* Simple Styled CSS/SVG Graph */}
          <div className="h-48 w-full flex items-end justify-between pt-6 border-b border-slate-100 pb-2 px-2 gap-4">
            {[
              { day: "Mon", sales: 40 },
              { day: "Tue", sales: 15 },
              { day: "Wed", sales: 85 },
              { day: "Thu", sales: 60 },
              { day: "Fri", sales: 30 },
              { day: "Sat", sales: 110 },
              { day: "Sun", sales: 95 },
            ].map((bar, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
                <div className="w-full relative rounded-t-lg bg-indigo-50 group-hover:bg-indigo-100 transition h-32 flex items-end">
                  <div
                    style={{ height: `${(bar.sales / 120) * 100}%` }}
                    className="w-full bg-indigo-600 group-hover:bg-indigo-700 transition-all rounded-t-lg relative shadow-inner"
                  >
                    <span className="absolute -top-7 left-1/2 -translate-x-1/2 rounded bg-slate-900 px-1.5 py-0.5 text-[9px] font-bold text-white opacity-0 group-hover:opacity-100 transition shadow">
                      ${bar.sales}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-slate-400 group-hover:text-slate-800 transition">
                  {bar.day}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Tips & Recommendations */}
        <div className="card p-6 bg-slate-50/50 border border-slate-100 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900">Seller Guidelines</h3>
            <div className="space-y-3 text-xs leading-relaxed text-slate-600">
              <div className="flex gap-2">
                <span>📦</span>
                <p><strong>Maintain stock:</strong> Top-selling items are running low. Keep inventory counts updated to avoid stockouts.</p>
              </div>
              <div className="flex gap-2">
                <span>🚚</span>
                <p><strong>Fast shipping:</strong> Ship orders within 24 hours of placement to receive higher buyer ratings and marketplace placement.</p>
              </div>
              <div className="flex gap-2">
                <span>🌱</span>
                <p><strong>Quality guarantee:</strong> Ensure vegetables and fruits are fresh and pesticide-free to support the organic standard.</p>
              </div>
            </div>
          </div>
          <Link href="/products" className="mt-6 rounded-xl bg-slate-900 text-center py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition">
            Manage Catalog
          </Link>
        </div>
      </div>

      {/* Order Fulfillment Panel */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Customer Orders to Fulfill ({sellerOrders.length})</h2>

        {sellerOrders.length === 0 ? (
          <div className="card p-8 text-center text-slate-500 bg-white/60">
            No customer orders containing your products have been placed yet.
          </div>
        ) : (
          <div className="space-y-4">
            {sellerOrders.map((order) => {
              // Find items belonging to this seller
              const sellerItems = order.items.filter((item) => sellerProductIds.has(item.productId));
              const orderSellerTotal = sellerItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

              return (
                <div
                  key={order.id}
                  className="card p-6 bg-white border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                  <div className="space-y-3 flex-1">
                    {/* Header info */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-tight">
                        Order ID: {order.id.slice(-6).toUpperCase()}
                      </span>
                      <span className="text-[11px] text-slate-400">• {order.date}</span>
                      
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

                    {/* Ordered Items list */}
                    <div className="space-y-1.5 pl-1.5 border-l-2 border-slate-100">
                      {sellerItems.map((item, idx) => (
                        <div key={idx} className="text-xs text-slate-700 flex justify-between max-w-md">
                          <span>
                            {item.title} <span className="text-slate-400">x{item.quantity}</span>
                          </span>
                          <span className="font-semibold text-slate-900">
                            ${(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Address details */}
                    <div className="text-xs text-slate-500">
                      📍 <strong>Shipping To:</strong> {order.deliveryLocation}
                    </div>
                  </div>

                  {/* Pricing & Control buttons */}
                  <div className="flex flex-col items-end gap-3 justify-center">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                        Your Order Earnings
                      </span>
                      <span className="text-lg font-black text-slate-900">
                        ${orderSellerTotal.toFixed(2)}
                      </span>
                    </div>

                    {/* Actions */}
                    {order.status === "Pending" && (
                      <button
                        onClick={() => sellerShipOrder(order.id)}
                        className="rounded-full bg-indigo-600 hover:bg-indigo-700 px-5 py-2 text-xs font-bold text-white shadow-md shadow-indigo-600/10 transition"
                      >
                        Ship Order 🚚
                      </button>
                    )}
                    {order.status === "Shipped" && (
                      <button
                        onClick={() => sellerDeliverOrder(order.id)}
                        className="rounded-full bg-emerald-600 hover:bg-emerald-700 px-5 py-2 text-xs font-bold text-white shadow-md shadow-emerald-600/10 transition"
                      >
                        Mark Delivered ✅
                      </button>
                    )}
                    {order.status === "Delivered" && (
                      <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                        Completed ✓
                      </span>
                    )}
                    {order.status === "Cancelled" && (
                      <span className="text-xs font-bold text-rose-500">
                        Cancelled
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
