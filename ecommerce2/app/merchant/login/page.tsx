"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Input from "../../components/input";
import Button from "../../components/button";
import { verifyMerchant } from "../../lib/merchantStorage";
import { useAuth } from "../../auth/AuthProvider";

export default function MerchantLoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMsg(null);
    if (!email || !password) {
      setMsg("Please enter your merchant email and password.");
      return;
    }

    setLoading(true);
    const merchant = verifyMerchant(email, password);
    if (!merchant) {
      setMsg("Invalid merchant email or password.");
      setLoading(false);
      return;
    }

    login({ email: merchant.email, name: merchant.storeName, role: "merchant" });
    router.push("/merchant/dashboard");
  };

  return (
    <section className="space-y-6">
      <div className="card p-8">
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700">Merchant access</p>
          <h1 className="text-3xl font-semibold text-slate-950">Login to your merchant account</h1>
          <p className="text-slate-600">Access your dashboard and update product listings.</p>
        </div>
        <form onSubmit={onSubmit} className="mt-8 grid gap-4 sm:max-w-md">
          {msg ? <div className="text-sm text-amber-700">{msg}</div> : null}
          <Input type="email" name="email" placeholder="Email..." value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input type="password" name="password" placeholder="Password..." value={password} onChange={(e) => setPassword(e.target.value)} />
          <Button type="submit" text={loading ? "Signing in..." : "Merchant login"} />
        </form>
      </div>
    </section>
  );
}
