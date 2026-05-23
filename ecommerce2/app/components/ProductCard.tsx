import type { Product } from "@/lib/types";
import { addToCart } from "../cart/actions";

type ProductCardProps = {
  product: Product;
};

export default function ProductCard({ product }: ProductCardProps) {
  const merchantName =
    product.profiles?.full_name || product.profiles?.email || "Merchant";

  return (
    <article className="card flex flex-col overflow-hidden">
      {product.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={product.image_url}
          alt={product.title}
          className="h-44 w-full object-cover"
        />
      ) : (
        <div className="flex h-44 items-center justify-center bg-emerald-50 text-sm text-emerald-800">
          No image
        </div>
      )}
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
            {merchantName}
          </p>
          <h2 className="mt-1 text-lg font-semibold text-slate-950">{product.title}</h2>
          <p className="mt-2 line-clamp-3 text-sm text-slate-600">{product.description}</p>
        </div>
        <div className="mt-auto flex items-center justify-between gap-3">
          <span className="text-xl font-semibold text-emerald-800">
            ${Number(product.price).toFixed(2)}
          </span>
          <form action={addToCart}>
            <input type="hidden" name="productId" value={product.id} />
            <button
              type="submit"
              className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Add to cart
            </button>
          </form>
        </div>
      </div>
    </article>
  );
}
