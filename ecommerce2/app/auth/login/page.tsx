"use client";

"use client";

import { useEffect, useState } from "react";
import Input from "../../components/input";
import Button from "../../components/button";
import { loginFunc } from "./login";

export default function LoginPage() {
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
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700">Secure access</p>
          <h1 className="text-3xl font-semibold text-slate-950">Login to your account</h1>
          <p className="text-slate-600">Enter your credentials to continue shopping with a polished modern experience.</p>
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
        <form action={loginFunc} className="mt-8 grid gap-4 sm:max-w-md">
          <Input type="email" name="email" placeholder="Email" />
          <Input type="password" name="password" placeholder="Password" />
          <Button type="submit" text="Login" />
        </form>
      </div>
    </section>
  );
}
