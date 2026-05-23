"use client";

import { useAuth } from "../auth/AuthProvider";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CartPage() {
  const { mockRole, cart, updateCartQuantity, removeFromCart, placeOrder } = useAuth();
  const router = useRouter();

  // Form states
  const [fullName, setFullName] = useState("");
  const [address, setAddress] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState(false);

  const [loading, setLoading] = useState(false);

  // Access check
  if (mockRole !== "customer") {
    return (
      <div className="card max-w-lg mx-auto p-8 text-center space-y-6 bg-white/90 shadow-xl border border-rose-100">
        <div className="mx-auto w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center text-rose-600 text-xl">
          🚫
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Access Denied</h1>
        <p className="text-sm text-slate-500">
          The shopping cart is reserved for Customers. Switch your role to "Customer" using the toolbar at the bottom right to view your cart.
        </p>
        <Link href="/" className="inline-block rounded-full bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700">
          Go back to store
        </Link>
      </div>
    );
  }

  // Calculator
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const tax = subtotal * 0.05; // 5% simulated tax
  const total = subtotal + tax;

  const handleCheckoutSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg("");

    if (!fullName.trim() || !address.trim()) {
      setErrorMsg("Please complete all checkout details.");
      return;
    }

    setLoading(true);
    try {
      const res = await placeOrder(`${fullName} - ${address}`);
      if (res.success) {
        setSuccessMsg(true);
        setTimeout(() => {
          router.push("/orders");
        }, 1500);
      } else {
        setErrorMsg(res.error || "Failed to process checkout.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

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

  if (successMsg) {
    return (
      <div className="card max-w-lg mx-auto p-12 text-center space-y-6 bg-white/95 shadow-2xl border border-emerald-100 animate-in fade-in zoom-in-95">
        <div className="mx-auto w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 text-4xl animate-bounce">
          🎉
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-slate-900">Order Placed!</h1>
          <p className="text-sm text-slate-500">
            Thank you for shopping at Green Market. Your Cash on Delivery order has been successfully logged.
          </p>
        </div>
        <p className="text-xs text-slate-400">
          Redirecting to your orders tracking page...
        </p>
      </div>
    );
  }

  return (
    <section className="space-y-8">
      {/* Page Title */}
      <div className="card p-6 md:p-8 bg-white/80 backdrop-blur shadow-sm border border-emerald-50/50">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-700">Shopping Cart</p>
        <h1 className="text-3xl font-extrabold text-slate-900">Manage Your Selections</h1>
        <p className="text-slate-500 text-sm">Review organic offerings in your bag and proceed to cash checkout.</p>
      </div>

      {cart.length === 0 ? (
        <div className="card p-16 text-center max-w-md mx-auto space-y-5 bg-white/80">
          <div className="text-5xl">🛒</div>
          <h2 className="text-xl font-bold text-slate-900">Your cart is empty</h2>
          <p className="text-sm text-slate-500">
            Add fresh items from our local farm catalogs to your cart to checkout.
          </p>
          <Link href="/" className="inline-block rounded-full bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white shadow hover:bg-emerald-700">
            Shop Market Catalog
          </Link>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
          {/* Left Column: Cart items */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Your Bag ({cart.length} items)</h2>
            
            <div className="space-y-3">
              {cart.map((item) => (
                <div
                  key={item.product.id}
                  className="card p-5 bg-white/95 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition hover:shadow-md"
                >
                  {/* Info Row */}
                  <div className="flex gap-4 items-center">
                    <div className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${getGradientByEmoji(item.product.imageUrl)} text-3xl shadow-inner`}>
                      {item.product.imageUrl || "🥬"}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm leading-snug">
                        {item.product.title}
                      </h3>
                      <p className="text-xs text-slate-500 max-w-[240px] truncate">
                        {item.product.description}
                      </p>
                      <span className="text-xs font-semibold text-emerald-800 mt-1 block">
                        ${item.product.price.toFixed(2)} each
                      </span>
                    </div>
                  </div>

                  {/* Quantity & Action Controls */}
                  <div className="flex items-center justify-between sm:justify-start gap-6 border-t pt-3 sm:border-none sm:pt-0">
                    <div className="flex items-center rounded-full border border-slate-200 p-0.5">
                      <button
                        onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-xs font-bold text-slate-800">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
                      >
                        +
                      </button>
                    </div>

                    <div className="text-right min-w-[70px]">
                      <span className="text-sm font-black text-slate-900">
                        ${(item.product.price * item.quantity).toFixed(2)}
                      </span>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="rounded-full p-1.5 text-slate-400 hover:bg-slate-50 hover:text-rose-600 transition"
                      title="Remove item"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Checkout Summary & Form */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Checkout</h2>
            
            <div className="card p-6 bg-white border border-slate-100 space-y-6">
              {/* Order pricing breakdown */}
              <div className="space-y-2.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-900">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Simulated Tax (5%)</span>
                  <span className="font-semibold text-slate-900">${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping Fee</span>
                  <span className="font-semibold text-emerald-700">Free</span>
                </div>
                <hr className="border-slate-100 my-1" />
                <div className="flex justify-between text-sm">
                  <span className="font-bold text-slate-950">Grand Total</span>
                  <span className="font-black text-emerald-800">${total.toFixed(2)}</span>
                </div>
              </div>

              {/* Delivery Form */}
              <form onSubmit={handleCheckoutSubmit} className="space-y-4">
                <hr className="border-slate-100" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Delivery Address details
                </h3>

                {errorMsg && (
                  <div className="rounded-xl bg-rose-50 border border-rose-100 p-2.5 text-center text-xs font-semibold text-rose-700">
                    ⚠️ {errorMsg}
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Recipient Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Jane Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Delivery Location / Address
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="e.g. 123 Farm Road, Green County"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50"
                  ></textarea>
                </div>

                {/* Pre-selected Payment: Cash on Delivery */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Payment Option
                  </label>
                  <div className="rounded-xl border border-emerald-600 bg-emerald-50/30 p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">💵</span>
                      <div>
                        <span className="text-xs font-bold text-emerald-950 block">
                          Cash on Delivery (COD)
                        </span>
                        <span className="text-[10px] text-emerald-700 block">
                          Pay upon delivery of products.
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-emerald-600">✓ Selected</span>
                  </div>
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-full bg-emerald-600 py-4 text-center text-xs font-bold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition hover:scale-[1.01] disabled:bg-slate-300 disabled:shadow-none disabled:cursor-not-allowed"
                >
                  {loading ? "Processing Order..." : `Place Order - $${total.toFixed(2)}`}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}