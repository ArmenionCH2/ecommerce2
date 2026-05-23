export const dynamic = "force-dynamic";

import Input from "./components/input";
import Button from "./components/button";
import ProductFeed from "./components/ProductFeed";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; message?: string }>;
}) {
  const params = await searchParams;

  return (
    <section className="space-y-8">
      <div className="card overflow-hidden p-8">
        <div className="max-w-2xl space-y-5">
          <p className="text-base font-semibold uppercase tracking-[0.25em] text-emerald-700">
            Fresh ecommerce
          </p>
          <h1 className="max-w-xl text-4xl font-semibold text-slate-950 sm:text-5xl">
            Shop products posted by merchants across the market.
          </h1>
          <p className="max-w-2xl text-base leading-8 text-slate-600">
            Every listing is stored in Supabase. Merchants publish from their dashboard; buyers browse
            the live feed and add items to a persistent cart.
          </p>
        </div>
        {params.message && (
          <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {params.message}
          </p>
        )}
        <form className="mt-8 grid gap-4 sm:grid-cols-[1fr_auto]" method="get">
          <Input
            type="text"
            name="search"
            placeholder="Search products..."
            required={false}
            minLength={0}
          />
          <Button type="submit" text="Search" />
        </form>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-slate-950">Product feed</h2>
        <ProductFeed search={params.search} />
      </div>
    </section>
  );
}
