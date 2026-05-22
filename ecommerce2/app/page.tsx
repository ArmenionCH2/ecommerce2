import Link from "next/link";
import Input from "./components/input";
import Button from "./components/button";

export default function Home() {
  return (
    <section className="space-y-8">
      <div className="card overflow-hidden p-8">
        <div className="max-w-2xl space-y-5">
          <p className="text-base font-semibold uppercase tracking-[0.25em] text-emerald-700">
            Fresh ecommerce
          </p>
          <h1 className="max-w-xl text-4xl font-semibold text-slate-950 sm:text-5xl">
            Discover green shopping with clean design and effortless checkout.
          </h1>
          <p className="max-w-2xl text-base leading-8 text-slate-600">
            Explore products, manage your cart, and enjoy a polished modern interface built around a calming green palette.
          </p>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-[1fr_auto]">
          <Input type="text" name="search" placeholder="Search products..." />
          <Button type="submit" text="Search" />
        </div>
      </div>

      <div className="rounded-3xl bg-emerald-50 p-8 text-slate-700 shadow-sm">
        <div className="max-w-3xl space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700">Merchant section</p>
          <h2 className="text-2xl font-semibold text-slate-950">Want to sell on Green Market?</h2>
          <p className="text-base leading-7 text-slate-600">
            Create a merchant account to add products, control quantities, set prices, and manage your online store.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/merchant/register"
              className="rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Merchant register
            </Link>
            <Link
              href="/merchant/login"
              className="rounded-full border border-emerald-200 px-5 py-3 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-100"
            >
              Merchant login
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
