"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthProvider";
import { addMerchantProduct, getMerchantProducts, MerchantProduct } from "../../lib/merchantStorage";
import Button from "../../components/button";
import Input from "../../components/input";

export default function MerchantDashboardPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<MerchantProduct[]>([]);
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState(0);
  const [photo, setPhoto] = useState("");
  const [description, setDescription] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role === "merchant" && user.email) {
      setProducts(getMerchantProducts(user.email));
    }
  }, [user]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMsg(null);

    if (!user?.email || !name || !description || !photo || price <= 0 || quantity <= 0) {
      setMsg("Please complete all product fields with valid values.");
      return;
    }

    const updated = addMerchantProduct(user.email, {
      name,
      quantity,
      price,
      photo,
      description,
    });
    setProducts(updated);
    setName("");
    setQuantity(1);
    setPrice(0);
    setPhoto("");
    setDescription("");
    setMsg("Product added successfully.");
  };

  if (!user || user.role !== "merchant") {
    return (
      <div className="card p-8">
        <h1 className="text-2xl font-semibold text-slate-950">Merchant access required</h1>
        <p className="mt-3 text-slate-600">Please login with a merchant account to manage products.</p>
      </div>
    );
  }

  return (
    <section className="space-y-8">
      <div className="card p-8">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700">Dashboard</p>
          <h1 className="text-3xl font-semibold text-slate-950">{user.name}'s product manager</h1>
          <p className="text-slate-600">Add inventory, set pricing, and manage your merchant store.</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 grid gap-4 sm:max-w-2xl">
          {msg ? <div className="text-sm text-emerald-800">{msg}</div> : null}
          <Input type="text" name="name" placeholder="Product name..." value={name} onChange={(e) => setName(e.target.value)} />
          <Input type="number" name="quantity" placeholder="Quantity" value={quantity} min={1} onChange={(e) => setQuantity(Number(e.target.value))} />
          <Input type="number" name="price" placeholder="Price" value={price} min={0} step={0.01} onChange={(e) => setPrice(Number(e.target.value))} />
          <Input type="text" name="photo" placeholder="Photo URL..." value={photo} onChange={(e) => setPhoto(e.target.value)} />
          <textarea
            className="min-h-[120px] rounded-3xl border border-emerald-200 bg-white/90 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition duration-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            placeholder="Product description..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <Button type="submit" text="Add product" />
        </form>
      </div>

      <div className="card p-8">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-2xl font-semibold text-slate-950">Your products</h2>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm text-emerald-900">{products.length} items</span>
        </div>
        <div className="mt-6 grid gap-4">
          {products.length === 0 ? (
            <p className="text-slate-600">No products yet. Add one to display it here.</p>
          ) : (
            products.map((product) => (
              <div key={product.id} className="rounded-3xl border border-emerald-100 bg-white/95 p-5 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  {product.photo ? (
                    <img src={product.photo} alt={product.name} className="h-24 w-24 rounded-3xl object-cover" />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-emerald-50 text-sm text-emerald-700">
                      No image
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-slate-950">{product.name}</h3>
                    <p className="mt-2 text-slate-600">{product.description}</p>
                    <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-700">
                      <span className="rounded-full bg-slate-100 px-3 py-1">Qty: {product.quantity}</span>
                      <span className="rounded-full bg-slate-100 px-3 py-1">Price: ${product.price.toFixed(2)}</span>
                      <span className="rounded-full bg-slate-100 px-3 py-1">Added {new Date(product.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
