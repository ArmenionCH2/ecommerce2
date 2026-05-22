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
    </section>
  );
}
