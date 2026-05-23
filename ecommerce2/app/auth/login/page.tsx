"use client";

import { useRouter } from "next/navigation";
import React, { useState } from "react";
import Link from "next/link";
import { createClient } from "../../utils/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<"customer" | "seller">("customer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg("");

    if (!email.trim() || !password.trim()) {
      setErrorMsg("Please fill in all fields.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setErrorMsg(authError.message);
        setLoading(false);
        return;
      }

      if (authData?.user) {
        // Query the profile role from postgres
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", authData.user.id)
          .single();

        if (profileError || !profile) {
          setErrorMsg("Failed to retrieve user profile role. Contact support.");
          await supabase.auth.signOut();
          setLoading(false);
          return;
        }

        // Verify the user is logging in with the correct role
        if (profile.role !== role) {
          setErrorMsg(`This account is registered as a ${profile.role}, not a ${role}.`);
          await supabase.auth.signOut();
          setLoading(false);
          return;
        }

        // Redirect based on role
        if (role === "seller") {
          router.push("/dashboard");
        } else {
          router.push("/");
        }
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
            🔐
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">
            Welcome Back
          </p>
          <h1 className="text-3xl font-extrabold text-slate-900">
            Sign In
          </h1>
          <p className="text-xs text-slate-500">
            Enter your credentials to manage your shopping cart or store.
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mt-6 rounded-xl bg-rose-50 border border-rose-100 p-3 text-center text-xs font-semibold text-rose-700 animate-pulse">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={onSubmit} className="mt-8 space-y-5">
          {/* Role Choice */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              I want to:
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
                🛒 Buy products
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
                👨‍💼 Sell products
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
              placeholder="e.g. user@example.com"
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
            {loading ? "Signing In..." : `Sign In as ${role === "customer" ? "Customer" : "Seller"}`}
          </button>
        </form>

        {/* Footer info */}
        <div className="mt-6 text-center text-xs text-slate-500">
          Don't have an account?{" "}
          <Link
            href="/auth/register"
            className="font-bold text-emerald-700 hover:text-emerald-900 underline"
          >
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
}