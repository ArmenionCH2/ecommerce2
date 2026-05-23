"use client";

"use client";

import { useEffect, useState } from "react";
import Input from "../../components/input";
import Button from "../../components/button";

import { registerFunc } from "./register";

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setError(params.get("error"));
    setMessage(params.get("message"));
  }, []);

  return (
    <section className="space-y-6">
      <div className="card p-8">
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700">Join the market</p>
          <h1 className="text-3xl font-semibold text-slate-950">Create your account</h1>
          <p className="text-slate-600">Register now to save your cart and enjoy faster checkout.</p>
        </div>
        {error ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        ) : null}
        {message ? (
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            {message}
          </div>
        ) : null}
        <form action={registerFunc} className="mt-8 grid gap-4 sm:max-w-md">
          <Input type="email" name="email" placeholder="Email" />
          <Input type="password" name="password" placeholder="Password" />

          <div className="grid gap-3 rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-slate-700">
            <p className="font-semibold text-slate-950">Account type</p>
            <label className="flex items-center gap-3">
              <input type="radio" name="role" value="customer" defaultChecked className="h-4 w-4" />
              <span>I want to buy (Customer)</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="radio" name="role" value="seller" className="h-4 w-4" />
              <span>I want to sell (Seller)</span>
            </label>
          </div>

          <Button type="submit" text="Register" />
        </form>
      </div>
    </section>
  );
}
