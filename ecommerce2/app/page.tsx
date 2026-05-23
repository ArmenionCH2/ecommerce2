import Input from "./components/input";
import Button from "./components/button";

const products = [
  { id: 1, name: "Forest Tote Bag", price: "$24", description: "Eco-friendly canvas bag for everyday shopping." },
  { id: 2, name: "Herbal Candle Set", price: "$32", description: "Relaxing candles with natural scents for a calm home." },
  { id: 3, name: "Organic Sneakers", price: "$88", description: "Lightweight shoes made from recycled materials." },
  { id: 4, name: "Green Market Hoodie", price: "$54", description: "Soft cotton hoodie with a crisp green design." },
];

export default function Home() {
  return (
    <section className="space-y-8 py-8">
      <div className="card overflow-hidden p-8">
        <div className="max-w-2xl space-y-5">
          <p className="text-base font-semibold uppercase tracking-[0.25em] text-emerald-700">
            Fresh ecommerce
          </p>
          <h1 className="max-w-xl text-4xl font-semibold text-slate-950 sm:text-5xl">
            Discover products, shop with confidence, and find everything you need.
          </h1>
          <p className="max-w-2xl text-base leading-8 text-slate-600">
            Browse a curated collection of modern goods, then add items to your cart or manage your seller storefront.
          </p>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-[1fr_auto]">
          <Input type="text" name="search" placeholder="Search products..." />
          <Button type="submit" text="Search" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((product) => (
          <article key={product.id} className="card p-6">
            <p className="text-sm uppercase tracking-[0.25em] text-emerald-700">Product</p>
            <h2 className="mt-3 text-xl font-semibold text-slate-950">{product.name}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">{product.description}</p>
            <div className="mt-6 flex items-center justify-between">
              <span className="text-lg font-semibold text-slate-950">{product.price}</span>
              <Button type="button" text="View" />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
