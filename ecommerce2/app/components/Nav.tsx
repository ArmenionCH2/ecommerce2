"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../auth/AuthProvider";

export default function Nav() {
  const { user, logout } = useAuth();
  const [search, setSearch] = useState("");
  const router = useRouter();
  const role = user?.role ?? "guest";

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = search.trim();
    if (query) {
      router.push(`/?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <div className="page-container flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <Link href="/" className="text-xl font-semibold tracking-tight text-emerald-900">
          Green Market
        </Link>
        <p className="text-sm text-slate-600">Fresh shopping</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {role !== "seller" ? (
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="rounded-full border border-emerald-200 bg-white/90 px-4 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              placeholder="Search products..."
            />
            <button
              type="submit"
              className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Search
            </button>
          </form>
        ) : null}

        <nav className="flex flex-wrap items-center gap-2 text-sm text-slate-700">
          {role === "guest" && (
            <>
              <Link href="/" className="rounded-full px-4 py-2 transition hover:bg-emerald-50 hover:text-emerald-900">
                Home
              </Link>
              <Link href="/auth/login" className="rounded-full px-4 py-2 transition hover:bg-emerald-50 hover:text-emerald-900">
                Login
              </Link>
              <Link href="/auth/register" className="rounded-full px-4 py-2 bg-emerald-600 text-white">
                Register
              </Link>
            </>
          )}

          {role === "customer" && (
            <>
              <Link href="/" className="rounded-full px-4 py-2 transition hover:bg-emerald-50 hover:text-emerald-900">
                Home
              </Link>
              <Link href="/cart" className="rounded-full px-4 py-2 transition hover:bg-emerald-50 hover:text-emerald-900">
                Cart
              </Link>
              <Link href="/orders" className="rounded-full px-4 py-2 transition hover:bg-emerald-50 hover:text-emerald-900">
                Orders
              </Link>
              <button
                onClick={async () => {
                  await logout();
                  router.push("/");
                }}
                className="rounded-full bg-amber-50 px-4 py-2 text-amber-800 hover:bg-amber-100"
              >
                Logout
              </button>
            </>
          )}

          {role === "seller" && (
            <>
              <Link href="/products" className="rounded-full px-4 py-2 transition hover:bg-emerald-50 hover:text-emerald-900">
                Products
              </Link>
              <Link href="/dashboard" className="rounded-full px-4 py-2 transition hover:bg-emerald-50 hover:text-emerald-900">
                Dashboard
              </Link>
              <button
                onClick={async () => {
                  await logout();
                  router.push("/");
                }}
                className="rounded-full bg-amber-50 px-4 py-2 text-amber-800 hover:bg-amber-100"
              >
                Logout
              </button>
            </>
          )}
        </nav>
      </div>
    </div>
  );
}
