"use client";

import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useAuth } from "../auth/AuthProvider";
import React, { useState, useEffect } from "react";

export default function Nav() {
  const { user, mockRole, logout, cart, orders } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Keep search query in local input state
  const [searchQuery, setSearchQuery] = useState("");

  // Sync state with URL search param
  useEffect(() => {
    const currentSearch = searchParams.get("search") || "";
    setSearchQuery(currentSearch);
  }, [searchParams]);

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push("/");
    }
  };

  const handleSearchClear = () => {
    setSearchQuery("");
    router.push("/");
  };

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const pendingOrdersCount = orders.filter((o) => o.status === "Pending").length;

  return (
    <div className="page-container flex flex-col gap-4 py-4 md:flex-row md:items-center md:justify-between">
      {/* Brand logo */}
      <div className="flex items-center justify-between">
        <Link href={mockRole === "seller" ? "/dashboard" : "/"} className="group flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-xl text-white shadow-md shadow-emerald-500/20 transition-all group-hover:scale-105">
            🌱
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-emerald-950 block leading-none">
              Green Market
            </span>
            <span className="text-[11px] font-medium text-emerald-700 tracking-wider uppercase">
              {mockRole === "seller" ? "Seller Central" : "Organic Store"}
            </span>
          </div>
        </Link>
      </div>

      {/* Conditional Search Bar for Guests & Customers */}
      {mockRole !== "seller" && (
        <form
          onSubmit={handleSearchSubmit}
          className="relative flex flex-1 max-w-md items-center md:mx-6"
        >
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search organic products (e.g. Honey, Spinach)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full border border-emerald-100 bg-emerald-50/40 py-2.5 pl-10 pr-10 text-sm text-slate-800 transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-100"
            />
            {/* Search Icon */}
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
              🔍
            </span>
            {/* Clear Button */}
            {searchQuery && (
              <button
                type="button"
                onClick={handleSearchClear}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-xs text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>
        </form>
      )}

      {/* Navigation Links */}
      <nav className="flex flex-wrap items-center gap-2 text-sm">
        {mockRole === "guest" && (
          <>
            <Link
              href="/"
              className={`rounded-full px-4 py-2 font-medium transition ${
                pathname === "/"
                  ? "bg-emerald-50 text-emerald-800"
                  : "text-slate-600 hover:bg-slate-50 hover:text-emerald-900"
              }`}
            >
              Home
            </Link>
            <Link
              href="/auth/login"
              className="rounded-full px-4 py-2 font-medium text-slate-600 transition hover:bg-slate-50 hover:text-emerald-900"
            >
              Login
            </Link>
            <Link
              href="/auth/register"
              className="rounded-full bg-emerald-600 px-5 py-2 font-semibold text-white shadow-md shadow-emerald-600/10 transition hover:bg-emerald-700"
            >
              Register
            </Link>
          </>
        )}

        {mockRole === "customer" && (
          <>
            <Link
              href="/"
              className={`rounded-full px-4 py-2 font-medium transition ${
                pathname === "/"
                  ? "bg-emerald-50 text-emerald-800"
                  : "text-slate-600 hover:bg-slate-50 hover:text-emerald-900"
              }`}
            >
              Home
            </Link>
            <Link
              href="/cart"
              className={`relative rounded-full px-4 py-2 font-medium transition ${
                pathname === "/cart"
                  ? "bg-emerald-50 text-emerald-800"
                  : "text-slate-600 hover:bg-slate-50 hover:text-emerald-900"
              }`}
            >
              Cart
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white shadow animate-pulse">
                  {cartCount}
                </span>
              )}
            </Link>
            <Link
              href="/orders"
              className={`relative rounded-full px-4 py-2 font-medium transition ${
                pathname === "/orders"
                  ? "bg-emerald-50 text-emerald-800"
                  : "text-slate-600 hover:bg-slate-50 hover:text-emerald-900"
              }`}
            >
              Orders
              {pendingOrdersCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white shadow">
                  {pendingOrdersCount}
                </span>
              )}
            </Link>
            
            <div className="h-4 w-[1px] bg-slate-200 mx-2"></div>
            
            <span className="text-xs text-slate-500 max-w-[120px] truncate hidden md:block">
              {user?.email}
            </span>

            <button
              onClick={() => logout()}
              className="rounded-full bg-slate-100 hover:bg-slate-200 px-4 py-2 text-slate-700 font-semibold transition"
            >
              Logout
            </button>
          </>
        )}

        {mockRole === "seller" && (
          <>
            <Link
              href="/products"
              className={`rounded-full px-4 py-2 font-medium transition ${
                pathname === "/products"
                  ? "bg-emerald-50 text-emerald-800"
                  : "text-slate-600 hover:bg-slate-50 hover:text-emerald-900"
              }`}
            >
              Products
            </Link>
            <Link
              href="/dashboard"
              className={`rounded-full px-4 py-2 font-medium transition ${
                pathname === "/dashboard"
                  ? "bg-emerald-50 text-emerald-800"
                  : "text-slate-600 hover:bg-slate-50 hover:text-emerald-900"
              }`}
            >
              Dashboard
            </Link>

            <div className="h-4 w-[1px] bg-slate-200 mx-2"></div>

            <span className="text-xs text-slate-500 max-w-[120px] truncate hidden md:block">
              Seller: {user?.email}
            </span>

            <button
              onClick={() => logout()}
              className="rounded-full bg-indigo-50 hover:bg-indigo-100 px-4 py-2 text-indigo-700 font-semibold transition"
            >
              Logout
            </button>
          </>
        )}
      </nav>
    </div>
  );
}
