"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useAuth, Product } from "./auth/AuthProvider";
import { useState, Suspense } from "react";
import Link from "next/link";

function MarketContent() {
  const { products, mockRole, addToCart } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const searchQuery = searchParams.get("search") || "";

  // Modal State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [addedProductId, setAddedProductId] = useState<string | null>(null);

  // Filter products by search query
  const filteredProducts = products.filter((p) => {
    const query = searchQuery.toLowerCase();
    return (
      p.title.toLowerCase().includes(query) ||
      p.description.toLowerCase().includes(query)
    );
  });

  const handleAddToCart = (product: Product, qty: number = 1) => {
    addToCart(product, qty);
    setAddedProductId(product.id);
    setTimeout(() => {
      setAddedProductId(null);
    }, 1500);
  };

  const handleBuyNow = (product: Product, qty: number = 1) => {
    addToCart(product, qty);
    router.push("/cart");
  };

  const openProductModal = (product: Product) => {
    setSelectedProduct(product);
    setQuantity(1);
  };

  const closeProductModal = () => {
    setSelectedProduct(null);
  };

  // Helper to color-code gradients based on product emojis/types
  const getGradientByEmoji = (emoji: string) => {
    switch (emoji) {
      case "🍯": return "from-amber-100 to-yellow-200 text-amber-800";
      case "🥬": return "from-green-100 to-emerald-200 text-emerald-800";
      case "🥑": return "from-emerald-100 to-teal-200 text-emerald-800";
      case "🫒": return "from-lime-100 to-green-200 text-green-800";
      case "🍓": return "from-red-100 to-rose-200 text-rose-800";
      default: return "from-emerald-50 to-teal-100 text-emerald-800";
    }
  };

  if (mockRole === "seller") {
    return (
      <div className="card max-w-2xl mx-auto p-10 text-center space-y-6 bg-white/90 backdrop-blur shadow-xl border border-indigo-100">
        <div className="mx-auto w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-3xl">
          👨‍💼
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-slate-900">Seller Dashboard</h1>
          <p className="text-slate-600">
            Welcome back! You are logged in as a Seller. Use the links below or the navbar to manage your store.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
          <Link
            href="/products"
            className="rounded-full bg-indigo-600 px-6 py-3 font-semibold text-white shadow-md shadow-indigo-600/10 hover:bg-indigo-700 transition"
          >
            Manage Your Products
          </Link>
          <Link
            href="/dashboard"
            className="rounded-full bg-slate-100 px-6 py-3 font-semibold text-slate-700 hover:bg-slate-200 transition"
          >
            View Shop Analytics
          </Link>
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-10">
      {/* Welcome Hero Banner */}
      {!searchQuery && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-800 via-emerald-900 to-teal-950 p-8 text-white shadow-xl md:p-12">
          {/* Decorative shapes */}
          <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-emerald-700/20 blur-3xl"></div>
          <div className="absolute bottom-0 left-1/3 -mb-20 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl"></div>

          <div className="relative max-w-2xl space-y-6">
            <span className="inline-block rounded-full bg-emerald-500/20 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-300">
              Welcome to Green Market
            </span>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl md:text-6xl">
              Fresh organic produce delivered to your doorstep.
            </h1>
            <p className="text-emerald-100/80 text-base md:text-lg leading-relaxed max-w-xl">
              We source directly from trusted local farmers to bring you pesticide-free, sustainably-grown food. Simple shopping, clear tracing.
            </p>
            <div className="pt-2">
              <button
                onClick={() => {
                  const el = document.getElementById("catalog");
                  el?.scrollIntoView({ behavior: "smooth" });
                }}
                className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-emerald-900 shadow-lg shadow-black/10 transition hover:bg-emerald-50 hover:scale-105"
              >
                Browse Catalog ↓
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Catalog Grid */}
      <div id="catalog" className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              {searchQuery ? `Search Results for "${searchQuery}"` : "Our Fresh Catalog"}
            </h2>
            <p className="text-sm text-slate-500">
              {filteredProducts.length} items available
            </p>
          </div>
          {searchQuery && (
            <button
              onClick={() => router.push("/")}
              className="self-start text-xs font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
            >
              ← Back to all products
            </button>
          )}
        </div>

        {filteredProducts.length === 0 ? (
          <div className="card p-12 text-center max-w-md mx-auto space-y-4 bg-white/70">
            <div className="text-4xl">🌾</div>
            <h3 className="text-lg font-bold text-slate-950">No products found</h3>
            <p className="text-sm text-slate-500">
              We couldn't find any products matching "{searchQuery}". Try searching for something else or browse our full store.
            </p>
            <button
              onClick={() => router.push("/")}
              className="rounded-full bg-emerald-600 px-5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition"
            >
              Clear Search
            </button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                onClick={() => openProductModal(product)}
                className="group card flex flex-col justify-between overflow-hidden bg-white/80 hover:bg-white cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-emerald-200/60"
              >
                {/* Visual Image Area */}
                <div className="relative flex h-48 w-full items-center justify-center bg-slate-50 overflow-hidden border-b border-emerald-50">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/10 to-emerald-100/20 opacity-0 group-hover:opacity-100 transition duration-300"></div>
                  <div className={`flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br ${getGradientByEmoji(product.imageUrl)} text-5xl shadow-inner transition-transform duration-300 group-hover:scale-110`}>
                    {product.imageUrl || "📦"}
                  </div>
                  {product.stock <= 0 ? (
                    <span className="absolute left-3 top-3 rounded-full bg-rose-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-md">
                      Sold Out
                    </span>
                  ) : product.stock <= 5 ? (
                    <span className="absolute left-3 top-3 rounded-full bg-amber-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-md">
                      Only {product.stock} Left
                    </span>
                  ) : null}
                </div>

                {/* Details Section */}
                <div className="flex flex-1 flex-col p-5 space-y-3">
                  <div className="space-y-1">
                    <h3 className="font-bold text-slate-900 group-hover:text-emerald-800 transition line-clamp-1">
                      {product.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>
                  </div>

                  <div className="mt-auto pt-3 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-400 block font-medium">Price</span>
                      <span className="text-lg font-extrabold text-slate-900">${product.price.toFixed(2)}</span>
                    </div>
                    
                    <button
                      disabled={product.stock <= 0}
                      onClick={(e) => {
                        e.stopPropagation(); // prevent opening modal
                        handleAddToCart(product);
                      }}
                      className={`rounded-full px-4 py-2.5 text-xs font-bold shadow-md transition-all duration-200 ${
                        product.stock <= 0
                          ? "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"
                          : addedProductId === product.id
                          ? "bg-emerald-800 text-white"
                          : "bg-emerald-600 text-white hover:bg-emerald-700 hover:scale-105 active:scale-95 hover:shadow-emerald-600/20"
                      }`}
                    >
                      {product.stock <= 0
                        ? "Out of Stock"
                        : addedProductId === product.id
                        ? "Added! ✓"
                        : "Add to Cart"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            onClick={closeProductModal}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
          ></div>

          {/* Modal Container */}
          <div className="relative w-full max-w-2xl transform overflow-hidden rounded-3xl bg-white shadow-2xl transition-all duration-300 animate-in fade-in zoom-in-95 border border-emerald-100">
            {/* Close Button */}
            <button
              onClick={closeProductModal}
              className="absolute right-5 top-5 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition"
            >
              ✕
            </button>

            <div className="grid gap-6 md:grid-cols-2 p-6 md:p-8">
              {/* Product Visual */}
              <div className="flex items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100/50 p-8 h-64 md:h-full">
                <div className={`flex h-36 w-36 items-center justify-center rounded-3xl bg-gradient-to-br ${getGradientByEmoji(selectedProduct.imageUrl)} text-7xl shadow-lg`}>
                  {selectedProduct.imageUrl || "📦"}
                </div>
              </div>

              {/* Product Info */}
              <div className="flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div>
                    <span className="inline-block rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                      Seller Verified
                    </span>
                    <h2 className="mt-2 text-2xl font-bold text-slate-900">{selectedProduct.title}</h2>
                    <span className="text-2xl font-black text-emerald-700 block mt-1">
                      ${selectedProduct.price.toFixed(2)}
                    </span>
                  </div>

                  <hr className="border-slate-100" />

                  <div className="space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">Description</span>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {selectedProduct.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-slate-600">
                    <div>
                      Availability:{" "}
                      {selectedProduct.stock <= 0 ? (
                        <span className="font-bold text-rose-600">Out of Stock</span>
                      ) : (
                        <span className="font-bold text-emerald-700">{selectedProduct.stock} units available</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4 mt-auto">
                  {selectedProduct.stock > 0 && (
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Qty:</span>
                      <div className="flex items-center rounded-full border border-slate-200 p-1">
                        <button
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
                        >
                          -
                        </button>
                        <span className="w-10 text-center text-sm font-bold text-slate-800">
                          {quantity}
                        </span>
                        <button
                          onClick={() => setQuantity(Math.min(selectedProduct.stock, quantity + 1))}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      disabled={selectedProduct.stock <= 0}
                      onClick={() => {
                        handleAddToCart(selectedProduct, quantity);
                        closeProductModal();
                      }}
                      className="flex-1 rounded-full bg-slate-900 px-5 py-3.5 text-center text-xs font-bold text-white shadow hover:bg-slate-800 transition disabled:bg-slate-100 disabled:text-slate-400"
                    >
                      Add to Cart
                    </button>
                    <button
                      disabled={selectedProduct.stock <= 0}
                      onClick={() => {
                        handleBuyNow(selectedProduct, quantity);
                      }}
                      className="flex-1 rounded-full bg-emerald-600 px-5 py-3.5 text-center text-xs font-bold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition disabled:bg-slate-100 disabled:text-slate-400"
                    >
                      Buy Now
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-slate-500">Loading Market...</div>}>
      <MarketContent />
    </Suspense>
  );
}
