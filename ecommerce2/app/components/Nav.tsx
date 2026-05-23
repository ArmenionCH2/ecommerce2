"use client";

import Link from "next/link";
import { useAuth } from "../auth/AuthProvider";

export default function Nav() {
  const { user, logout } = useAuth();

  return (
    <div className="page-container flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <Link href="/" className="text-xl font-semibold tracking-tight text-emerald-900">
          Green Market
        </Link>
        <p className="text-sm text-slate-600">Fresh shopping for customers and sellers.</p>
      </div>

      {user?.role === "seller" ? (
        <nav className="flex flex-wrap items-center gap-3 text-sm text-slate-700">
          <Link href="/products" className="rounded-full px-4 py-2 transition hover:bg-emerald-50 hover:text-emerald-900">
            Products
          </Link>
          <Link href="/dashboard" className="rounded-full px-4 py-2 transition hover:bg-emerald-50 hover:text-emerald-900">
            Dashboard
          </Link>
          <button onClick={logout} className="rounded-full bg-amber-50 px-4 py-2 text-amber-800 hover:bg-amber-100">
            Logout
          </button>
        </nav>
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <form action="/" method="get" className="flex w-full max-w-sm items-center gap-2 rounded-full border border-emerald-200 bg-white/95 px-3 py-2 shadow-sm sm:w-auto">
            <input
              name="search"
              placeholder="Search products..."
              className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none"
            />
            <button type="submit" className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700">
              Search
            </button>
          </form>

          <nav className="flex flex-wrap items-center gap-3 text-sm text-slate-700">
            <Link href="/" className="rounded-full px-4 py-2 transition hover:bg-emerald-50 hover:text-emerald-900">
              Home
            </Link>
            {user ? (
              <>
                <Link href="/cart" className="rounded-full px-4 py-2 transition hover:bg-emerald-50 hover:text-emerald-900">
                  Cart
                </Link>
                <button onClick={logout} className="rounded-full bg-amber-50 px-4 py-2 text-amber-800 hover:bg-amber-100">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="rounded-full px-4 py-2 transition hover:bg-emerald-50 hover:text-emerald-900">
                  Login
                </Link>
                <Link href="/auth/register" className="rounded-full bg-emerald-600 px-4 py-2 text-white">
                  Register
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </div>
  );
}
