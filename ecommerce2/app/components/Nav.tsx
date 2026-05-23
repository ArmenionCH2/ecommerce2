"use client";

import Link from "next/link";
import { useAuth } from "../auth/AuthProvider";

export default function Nav() {
  const { user, loading, logout } = useAuth();
  const isMerchant = user?.role === "merchant";

  return (
    <div className="page-container flex flex-wrap items-center justify-between gap-3 py-4">
      <div>
        <Link
          href={isMerchant ? "/merchant/dashboard" : "/"}
          className="text-xl font-semibold tracking-tight text-emerald-900"
        >
          Green Market
        </Link>
        <p className="text-sm text-slate-600">
          {isMerchant ? "Merchant workspace" : "Fresh shopping"}
        </p>
      </div>

      <nav className="flex flex-wrap items-center gap-3 text-sm text-slate-700">
        {loading ? (
          <span className="rounded-full px-4 py-2 text-slate-400">...</span>
        ) : isMerchant ? (
          <>
            <Link
              href="/merchant/dashboard"
              className="rounded-full px-4 py-2 bg-emerald-600 text-white transition hover:bg-emerald-700"
            >
              Dashboard
            </Link>
            <span className="rounded-full px-4 py-2 text-emerald-900">{user?.name ?? user?.email}</span>
            <button
              onClick={() => logout()}
              className="rounded-full bg-amber-50 px-4 py-2 text-amber-800 hover:bg-amber-100"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link href="/" className="rounded-full px-4 py-2 transition hover:bg-emerald-50 hover:text-emerald-900">
              Feed
            </Link>
            <Link href="/cart" className="rounded-full px-4 py-2 transition hover:bg-emerald-50 hover:text-emerald-900">
              Cart
            </Link>
            {user ? (
              <>
                <span className="rounded-full px-4 py-2 text-emerald-900">{user.email}</span>
                <button
                  onClick={() => logout()}
                  className="rounded-full bg-amber-50 px-4 py-2 text-amber-800 hover:bg-amber-100"
                >
                  Logout
                </button>
              </>
            ) : (
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
                <Link
                  href="/merchant"
                  className="rounded-full px-4 py-2 text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-900"
                >
                  Sell
                </Link>
              </>
            )}
          </>
        )}
      </nav>
    </div>
  );
}
