"use client";

import { useAuth, Product } from "../auth/AuthProvider";
import { useState } from "react";
import Link from "next/link";

const EMOJI_OPTIONS = ["🍯", "🥬", "🥑", "🫒", "🍓", "🥕", "🍎", "🥦", "🍋", "🍌", "🍇", "🍅", "🧅", "🥔", "🥚", "🥛", "🍞", "🧀"];

export default function ProductsPage() {
  const { user, mockRole, products, addProduct, updateProduct, deleteProduct } = useAuth();

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [emoji, setEmoji] = useState("🍏");
  const [errorMsg, setErrorMsg] = useState("");

  // Filter products to only show the logged-in seller's products
  const sellerProducts = products.filter(
    (p) => p.sellerId === user?.id || p.sellerId === "seller-1"
  );

  const openAddModal = () => {
    setEditingProduct(null);
    setTitle("");
    setDescription("");
    setPrice("");
    setStock("");
    setEmoji("🥬");
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setTitle(product.title);
    setDescription(product.description);
    setPrice(product.price.toString());
    setStock(product.stock.toString());
    setEmoji(product.imageUrl || "📦");
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg("");

    const priceNum = parseFloat(price);
    const stockNum = parseInt(stock, 10);

    if (!title.trim() || isNaN(priceNum) || isNaN(stockNum)) {
      setErrorMsg("Please fill in all required fields with valid numbers.");
      return;
    }

    if (priceNum < 0 || stockNum < 0) {
      setErrorMsg("Price and stock cannot be negative.");
      return;
    }

    if (editingProduct) {
      // Edit mode
      updateProduct(editingProduct.id, {
        title,
        description,
        price: priceNum,
        stock: stockNum,
        imageUrl: emoji,
      });
    } else {
      // Add mode
      addProduct({
        title,
        description,
        price: priceNum,
        stock: stockNum,
        imageUrl: emoji,
      });
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}" from your catalog?`)) {
      deleteProduct(id);
    }
  };

  const getGradientByEmoji = (e: string) => {
    switch (e) {
      case "🍯": return "from-amber-100 to-yellow-200 text-amber-800";
      case "🥬": return "from-green-100 to-emerald-200 text-emerald-800";
      case "🥑": return "from-emerald-100 to-teal-200 text-emerald-800";
      case "🫒": return "from-lime-100 to-green-200 text-green-800";
      case "🍓": return "from-red-100 to-rose-200 text-rose-800";
      default: return "from-indigo-100 to-blue-200 text-indigo-800";
    }
  };

  // Access check
  if (mockRole !== "seller") {
    return (
      <div className="card max-w-lg mx-auto p-8 text-center space-y-6 bg-white/90 shadow-xl border border-rose-100">
        <div className="mx-auto w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center text-rose-600 text-xl">
          🚫
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Access Denied</h1>
        <p className="text-sm text-slate-500">
          This portal is reserved for Sellers only. Switch your role to "Seller" using the toolbar at the bottom right to view this page.
        </p>
        <Link href="/" className="inline-block rounded-full bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700">
          Go back to store
        </Link>
      </div>
    );
  }

  return (
    <section className="space-y-8">
      {/* Page Header */}
      <div className="card p-6 md:p-8 bg-white/80 backdrop-blur shadow-sm border border-emerald-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-indigo-600">Merchant Inventory</p>
          <h1 className="text-3xl font-extrabold text-slate-900">Manage Products</h1>
          <p className="text-slate-500 text-sm">Add new fresh items to the market or edit existing ones.</p>
        </div>
        <div>
          <button
            onClick={openAddModal}
            className="w-full sm:w-auto rounded-full bg-indigo-600 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all hover:scale-[1.02]"
          >
            + Add New Product
          </button>
        </div>
      </div>

      {/* Grid List */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Your Catalog ({sellerProducts.length} items)</h2>

        {sellerProducts.length === 0 ? (
          <div className="card p-12 text-center max-w-md mx-auto space-y-4 bg-white/60">
            <div className="text-4xl">📦</div>
            <h3 className="text-lg font-bold text-slate-950">Your catalog is empty</h3>
            <p className="text-sm text-slate-500">
              Get started by listing your first fresh food item for customers to buy.
            </p>
            <button
              onClick={openAddModal}
              className="rounded-full bg-indigo-600 px-5 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition"
            >
              Add Product
            </button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {sellerProducts.map((product) => (
              <div
                key={product.id}
                className="card flex bg-white hover:shadow-lg transition-all duration-200 border border-slate-100 overflow-hidden"
              >
                {/* Visual Icon Box */}
                <div className="relative flex w-28 items-center justify-center bg-slate-50 border-r border-slate-50">
                  <div className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${getGradientByEmoji(product.imageUrl)} text-3xl shadow-inner`}>
                    {product.imageUrl || "📦"}
                  </div>
                </div>

                {/* Details */}
                <div className="flex-1 p-5 flex flex-col justify-between">
                  <div className="space-y-1">
                    <h3 className="font-bold text-slate-900 text-sm line-clamp-1">{product.title}</h3>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {product.description || "No description provided."}
                    </p>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                        Price / Stock
                      </span>
                      <span className="text-sm font-extrabold text-slate-900">
                        ${product.price.toFixed(2)}
                      </span>
                      <span className="text-[11px] text-slate-500 ml-1.5">
                        ({product.stock} left)
                      </span>
                    </div>

                    <div className="flex gap-1.5">
                      <button
                        onClick={() => openEditModal(product)}
                        className="rounded-lg bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-700 transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(product.id, product.title)}
                        className="rounded-lg bg-rose-50 hover:bg-rose-100 px-2.5 py-1.5 text-xs font-bold text-rose-700 transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setIsModalOpen(false)}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          ></div>

          <div className="relative w-full max-w-md transform overflow-hidden rounded-3xl bg-white p-6 shadow-2xl transition-all border border-indigo-100">
            {/* Modal Title */}
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              {editingProduct ? "✏️ Edit Product details" : "➕ List New organic Item"}
            </h2>

            {/* Error Message */}
            {errorMsg && (
              <div className="mb-4 rounded-xl bg-rose-50 border border-rose-100 p-2.5 text-center text-xs font-semibold text-rose-700">
                ⚠️ {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Title */}
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Item Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Organic Blueberries"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
                />
              </div>

              {/* Row: Price & Stock */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Price ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="5.99"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Stock count *
                  </label>
                  <input
                    type="number"
                    step="1"
                    required
                    placeholder="20"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
                  />
                </div>
              </div>

              {/* Emoji Image Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                  Product Icon / Emoji *
                </label>
                <div className="flex items-center gap-3">
                  <div className="text-3xl p-2.5 rounded-xl bg-slate-50 border border-slate-200 min-w-[50px] text-center">
                    {emoji}
                  </div>
                  <div className="flex flex-wrap gap-1 max-h-[70px] overflow-y-auto border border-slate-100 rounded-lg p-1.5 bg-slate-50/50">
                    {EMOJI_OPTIONS.map((item) => (
                      <button
                        type="button"
                        key={item}
                        onClick={() => setEmoji(item)}
                        className={`h-7 w-7 text-sm rounded flex items-center justify-center hover:bg-white hover:shadow-sm ${
                          emoji === item ? "bg-white border border-indigo-200" : ""
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Tell buyers about this product, origins, organic certification..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
                ></textarea>
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 rounded-full border border-slate-200 py-3 text-center text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-full bg-indigo-600 py-3 text-center text-xs font-bold text-white shadow hover:bg-indigo-700"
                >
                  {editingProduct ? "Save Changes" : "List Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
