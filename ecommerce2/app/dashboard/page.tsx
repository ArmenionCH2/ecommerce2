import Button from "../components/button";

export default function DashboardPage() {
  return (
    <section className="space-y-8 py-8">
      <div className="card p-8">
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700">Seller dashboard</p>
          <h1 className="text-3xl font-semibold text-slate-950">Store performance</h1>
          <p className="text-slate-600">Get a quick view of orders, earnings, and product trends from your seller account.</p>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Revenue</p>
            <p className="mt-4 text-3xl font-semibold text-slate-950">$4,820</p>
          </div>
          <div className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Orders</p>
            <p className="mt-4 text-3xl font-semibold text-slate-950">124</p>
          </div>
          <div className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Products</p>
            <p className="mt-4 text-3xl font-semibold text-slate-950">8</p>
          </div>
        </div>
      </div>

      <div className="card p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">Recent orders</h2>
            <p className="mt-2 text-slate-600">A quick summary of recent activity in your store.</p>
          </div>
          <Button type="button" text="View full report" />
        </div>

        <div className="mt-6 space-y-4">
          <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Order #1092 — 2 items sold</p>
            <p className="mt-1 text-slate-700">Delivered to a happy customer in 2 days.</p>
          </div>
          <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Order #1086 — 1 item sold</p>
            <p className="mt-1 text-slate-700">Preparing shipment for the latest order.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
