"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useAuth } from "../auth/AuthProvider";

export default function Nav() {
  const { user, logout } = useAuth();
  const [search, setSearch] = useState("");

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  const guestOrCustomer = !user || user.role === "customer";

  return (
    <div className="page-container flex flex-wrap items-center justify-between gap-4 py-4">
      <div>
        <Link href="/" className="text-xl font-semibold tracking-tight text-emerald-900">
          Green Market
        </Link>
        <p className="text-sm text-slate-600">Fresh shopping</p>
      </div>

      <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        {guestOrCustomer ? (
          <form onSubmit={handleSearch} className="flex flex-1 items-center gap-2 rounded-full border border-emerald-200 bg-white/90 px-3 py-2 shadow-sm sm:max-w-xl">
            <input
              className="flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
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
          {user ? (
            user.role === "seller" ? (
              <>
                <Link href="/products" className="rounded-full px-4 py-2 transition hover:bg-emerald-50 hover:text-emerald-900">
                  Products
                </Link>
                <Link href="/dashboard" className="rounded-full px-4 py-2 transition hover:bg-emerald-50 hover:text-emerald-900">
                  Dashboard
                </Link>
              </>
            ) : (
              <>
                <Link href="/" className="rounded-full px-4 py-2 transition hover:bg-emerald-50 hover:text-emerald-900">
                  Home
                </Link>
                <Link href="/cart" className="rounded-full px-4 py-2 transition hover:bg-emerald-50 hover:text-emerald-900">
                  Cart
                </Link>
              </>
            )
          ) : (
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

          {user ? (
            <>
              <span className="rounded-full px-4 py-2 text-emerald-900">
                {user.role === "seller" ? "Seller" : "Customer"}
              </span>
              <button
                onClick={() => logout()}
                className="rounded-full bg-amber-50 px-4 py-2 text-amber-800 hover:bg-amber-100"
              >
                Logout
              </button>
            </>
          ) : null}
        </nav>
      </div>
    </div>
  );
}
