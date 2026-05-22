"use client";

import { useEffect, useState } from "react";
import { getAllProducts, DbProduct } from "../lib/merchantDb";

export default function ProductFeed() {
  const [products, setProducts] = useState<DbProduct[]>([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const data = await getAllProducts();
        if (mounted) setProducts(data);
      } catch (e) {
        // ignore for feed
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  if (products.length === 0) {
    return (
      <div className="card p-8">
        <h2 className="text-2xl font-semibold text-slate-950">Products</h2>
        <p className="mt-3 text-slate-600">No products yet. Check back later.</p>
      </div>
    );
  }

  return (
    <div className="card p-8">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-semibold text-slate-950">Products</h2>
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm text-emerald-900">{products.length} items</span>
      </div>
      <div className="mt-6 grid gap-4">
        {products.map((product) => (
          <div key={product.id} className="rounded-3xl border border-emerald-100 bg-white/95 p-5 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              {product.photo ? (
                <img src={product.photo} alt={product.name} className="h-24 w-24 rounded-3xl object-cover" />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-emerald-50 text-sm text-emerald-700">No image</div>
              )}
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-slate-950">{product.name}</h3>
                <p className="mt-2 text-slate-600">{product.description}</p>
                <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-700">
                  <span className="rounded-full bg-slate-100 px-3 py-1">Qty: {product.quantity}</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1">Price: ${product.price.toFixed(2)}</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1">{product.merchantStoreName ?? "Merchant"}</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1">Added {new Date(product.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
