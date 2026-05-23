"use client";

import { useRouter } from "next/navigation";
import React, { useState } from "react";
import Link from "next/link";
import { createClient } from "../../utils/supabase";

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<"customer" | "seller">("customer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      setErrorMsg("Please fill in all fields.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: role,
          },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        setErrorMsg(error.message);
        setLoading(false);
        return;
      }

      if (data?.user) {
        setSuccessMsg(
          "Registration successful! Please check your email to confirm registration, or try signing in."
        );
        setTimeout(() => {
          router.push("/auth/login");
        }, 3000);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center py-10">
      <div className="card w-full max-w-md overflow-hidden bg-white/95 p-8 shadow-2xl backdrop-blur border border-emerald-50">
        
        {/* Header */}
        <div className="space-y-3 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-2xl text-emerald-600">
            🌱
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">
            Get Started
          </p>
          <h1 className="text-3xl font-extrabold text-slate-900">
            Create Account
          </h1>
          <p className="text-xs text-slate-500">
            Join Green Market today to start listing products or shopping.
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mt-6 rounded-xl bg-rose-50 border border-rose-100 p-3 text-center text-xs font-semibold text-rose-700 animate-pulse">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="mt-6 rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-center text-xs font-semibold text-emerald-700">
            🎉 {successMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={onSubmit} className="mt-8 space-y-5">
          {/* Role Choice */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Join as a:
            </label>
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100/80 p-1">
              <button
                type="button"
                disabled={loading}
                onClick={() => setRole("customer")}
                className={`rounded-lg py-2.5 text-center text-xs font-bold transition duration-200 ${
                  role === "customer"
                    ? "bg-white text-emerald-950 shadow-md"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                🛒 Customer (Buyer)
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => setRole("seller")}
                className={`rounded-lg py-2.5 text-center text-xs font-bold transition duration-200 ${
                  role === "seller"
                    ? "bg-white text-indigo-950 shadow-md"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                👨‍💼 Seller (Merchant)
              </button>
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Email Address
            </label>
            <input
              type="email"
              disabled={loading}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. shopper@example.com"
              className="w-full rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition duration-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100/50"
              required
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Password
            </label>
            <input
              type="password"
              disabled={loading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="•••••••• (Min 6 characters)"
              className="w-full rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition duration-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100/50"
              required
            />
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Confirm Password
            </label>
            <input
              type="password"
              disabled={loading}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition duration-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100/50"
              required
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full rounded-2xl py-3.5 text-center text-sm font-bold text-white shadow-lg transition duration-200 hover:scale-[1.01] active:scale-95 disabled:bg-slate-300 disabled:shadow-none ${
              role === "seller"
                ? "bg-indigo-600 shadow-indigo-600/10 hover:bg-indigo-700"
                : "bg-emerald-600 shadow-emerald-600/10 hover:bg-emerald-700"
            }`}
          >
            {loading ? "Registering..." : `Create ${role === "customer" ? "Customer" : "Seller"} Account`}
          </button>
        </form>

        {/* Footer info */}
        <div className="mt-6 text-center text-xs text-slate-500">
          Already have an account?{" "}
          <Link
            href="/auth/login"
            className="font-bold text-emerald-700 hover:text-emerald-900 underline"
          >
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
}