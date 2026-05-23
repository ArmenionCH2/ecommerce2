"use client";

import Link from "next/link";
import { useAuth } from "../auth/AuthProvider";

export default function Nav() {
  const { user, loading, logout } = useAuth();
  const isMerchant = user?.role === "merchant";

  return (
    <div className="page-container flex items-center justify-between gap-3 py-4">
      <div>
        <Link
          href={isMerchant ? "/merchant" : "/"}
          className="text-xl font-semibold tracking-tight text-emerald-900"
        >
          Green Market
        </Link>
        <p className="text-sm text-slate-600">
          {isMerchant ? "Merchant workspace" : "Fresh shopping"}
        </p>
      </div>

      <nav className="flex flex-wrap items-center justify-end gap-2 text-sm text-slate-700">
        {loading ? (
          <span className="rounded-full px-4 py-2 text-slate-500">...</span>
        ) : isMerchant ? (
          <>
            <Link
              href="/merchant"
              className="rounded-full px-4 py-2 transition hover:bg-emerald-50 hover:text-emerald-900"
            >
              My products
            </Link>
            <Link
              href="/merchant/products/new"
              className="rounded-full bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700"
            >
              Add product
            </Link>
          </>
        ) : (
          <>
            <Link
              href="/"
              className="rounded-full px-4 py-2 transition hover:bg-emerald-50 hover:text-emerald-900"
            >
              Feed
            </Link>
            <Link
              href="/cart"
              className="rounded-full px-4 py-2 transition hover:bg-emerald-50 hover:text-emerald-900"
            >
              Cart
            </Link>
          </>
        )}

        {!loading && user ? (
          <>
            <span className="rounded-full px-4 py-2 text-emerald-900">
              {user.email}
              {isMerchant ? " · merchant" : ""}
            </span>
            <button
              onClick={() => logout()}
              className="rounded-full bg-amber-50 px-4 py-2 text-amber-800 hover:bg-amber-100"
            >
              Logout
            </button>
          </>
        ) : !loading ? (
          <>
            <Link
              href="/auth/login"
              className="rounded-full px-4 py-2 transition hover:bg-emerald-50 hover:text-emerald-900"
            >
              Login
            </Link>
            <Link href="/auth/register" className="rounded-full px-4 py-2 bg-emerald-600 text-white">
              Register
            </Link>
          </>
        ) : null}
      </nav>
    </div>
  );
}
