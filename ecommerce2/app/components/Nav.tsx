"use client";

import Link from "next/link";
import { useAuth } from "../auth/AuthProvider";

export default function Nav() {
  const { user, logout } = useAuth();

  return (
    <div className="page-container flex flex-wrap items-center justify-between gap-3 py-4">
      <div>
        <Link href="/" className="text-xl font-semibold tracking-tight text-emerald-900">
          Green Market
        </Link>
        <p className="text-sm text-slate-600">Fresh shopping</p>
      </div>

      <nav className="flex flex-wrap items-center gap-3 text-sm text-slate-700">
        <Link href="/" className="rounded-full px-4 py-2 transition hover:bg-emerald-50 hover:text-emerald-900">
          Home
        </Link>
        <Link href="/cart" className="rounded-full px-4 py-2 transition hover:bg-emerald-50 hover:text-emerald-900">
          Cart
        </Link>

        {user ? (
          user.role === "merchant" ? (
            <>
              <Link
                href="/merchant/dashboard"
                className="rounded-full px-4 py-2 bg-emerald-600 text-white transition hover:bg-emerald-700"
              >
                Dashboard
              </Link>
              <span className="rounded-full px-4 py-2 text-emerald-900">{user.name}</span>
              <button
                onClick={() => logout()}
                className="rounded-full bg-amber-50 px-4 py-2 text-amber-800 hover:bg-amber-100"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <span className="rounded-full px-4 py-2 text-emerald-900">{user.email ?? user.name}</span>
              <button
                onClick={() => logout()}
                className="rounded-full bg-amber-50 px-4 py-2 text-amber-800 hover:bg-amber-100"
              >
                Logout
              </button>
              <Link
                href="/merchant"
                className="rounded-full px-4 py-2 text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-900"
              >
                Merchant
              </Link>
            </>
          )
        ) : (
          <>
            <Link href="/auth/login" className="rounded-full px-4 py-2 transition hover:bg-emerald-50 hover:text-emerald-900">
              Login
            </Link>
            <Link href="/auth/register" className="rounded-full px-4 py-2 bg-emerald-600 text-white">
              Register
            </Link>
            <Link href="/merchant" className="rounded-full px-4 py-2 text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-900">
              Merchant
            </Link>
          </>
        )}
      </nav>
    </div>
  );
}
