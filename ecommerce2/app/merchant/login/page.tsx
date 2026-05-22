"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Input from "../../components/input";
import Button from "../../components/button";
import getSupabaseClient from "../../lib/supabaseClient";
import { useAuth } from "../../auth/AuthProvider";

export default function MerchantLoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMsg(null);
    if (!email || !password) {
      setMsg("Please enter your merchant email and password.");
      return;
    }

    setLoading(true);
    try {
      const supabase = getSupabaseClient();
      const { data: authData, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) {
        setMsg(loginError.message);
        setLoading(false);
        return;
      }

      const user = authData.user;
      if (!user) {
        setMsg("Unable to sign in as merchant.");
        setLoading(false);
        return;
      }

      const { data: merchant, error: merchantError } = await supabase
        .from("merchants")
        .select("id,store_name")
        .eq("auth_user_id", user.id)
        .single();

      if (merchantError || !merchant) {
        setMsg("This account is not registered as a merchant.");
        setLoading(false);
        return;
      }

      login({ email: user.email ?? email, name: merchant.store_name, role: "merchant" });
      router.push("/merchant/dashboard");
    } catch (error: any) {
      setMsg(error?.message || String(error));
      setLoading(false);
    }
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
