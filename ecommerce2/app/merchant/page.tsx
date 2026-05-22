import Link from "next/link";

export default function MerchantHome() {
  return (
    <section className="space-y-8">
      <div className="card p-8">
        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700">Merchant portal</p>
          <h1 className="text-4xl font-semibold text-slate-950">Sell with Green Market</h1>
          <p className="max-w-2xl text-base leading-8 text-slate-600">
            Create a merchant account, add products, and manage your inventory from a lightweight dashboard tailored for sellers.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Link
            href="/merchant/register"
            className="rounded-3xl bg-emerald-600 px-6 py-5 text-center text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Merchant register
          </Link>
          <Link
            href="/merchant/login"
            className="rounded-3xl border border-emerald-200 px-6 py-5 text-center text-sm font-semibold text-emerald-900 transition hover:bg-emerald-50"
          >
            Merchant login
          </Link>
        </div>
      </div>
    </section>
  );
}
