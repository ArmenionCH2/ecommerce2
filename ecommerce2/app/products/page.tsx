import Button from "../components/button";

const sellerProducts = [
  { id: 1, name: "Premium Eco Tote", price: "$24", status: "Live" },
  { id: 2, name: "Organic Candle", price: "$32", status: "Draft" },
  { id: 3, name: "Recycled Sneakers", price: "$88", status: "Live" },
];

export default function ProductsPage() {
  return (
    <section className="space-y-8 py-8">
      <div className="card p-8">
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700">Seller storefront</p>
          <h1 className="text-3xl font-semibold text-slate-950">Manage your products</h1>
          <p className="text-slate-600">Add new items, edit listings, and keep your shop updated for customers.</p>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button type="button" text="Add new product" />
          <Button type="button" text="Sync inventory" />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {sellerProducts.map((product) => (
          <article key={product.id} className="card p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-slate-950">{product.name}</h2>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm text-emerald-700">{product.status}</span>
            </div>
            <p className="mt-3 text-slate-600">Price: {product.price}</p>
            <div className="mt-6 flex gap-3">
              <Button type="button" text="Edit" />
              <Button type="button" text="View" />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
