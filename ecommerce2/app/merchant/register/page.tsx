"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Input from "../../components/input";
import Button from "../../components/button";
import { registerMerchant } from "../../lib/merchantStorage";
import { useAuth } from "../../auth/AuthProvider";

export default function MerchantRegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [storeName, setStoreName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMsg(null);
    if (!storeName || !email || !password) {
      setMsg("Please fill in all merchant fields.");
      return;
    }

    setLoading(true);
    const success = registerMerchant({ email, password, storeName });
    if (!success) {
      setMsg("This merchant account already exists. Please login instead.");
      setLoading(false);
      return;
    }

    register({ email, name: storeName, role: "merchant" });
    router.push("/merchant/dashboard");
  };

  return (
    <section className="space-y-6">
      <div className="card p-8">
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700">Merchant signup</p>
          <h1 className="text-3xl font-semibold text-slate-950">Create your merchant account</h1>
          <p className="text-slate-600">Register to manage products, quantities, pricing, and product details.</p>
        </div>

        <form onSubmit={onSubmit} className="mt-8 grid gap-4 sm:max-w-md">
          {msg ? <div className="text-sm text-amber-700">{msg}</div> : null}
          <Input type="text" name="storeName" placeholder="Store name..." value={storeName} onChange={(e) => setStoreName(e.target.value)} />
          <Input type="email" name="email" placeholder="Email..." value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input type="password" name="password" placeholder="Password..." value={password} onChange={(e) => setPassword(e.target.value)} />
          <Button type="submit" text={loading ? "Creating..." : "Register merchant"} />
        </form>
      </div>
    </section>
  );
}
