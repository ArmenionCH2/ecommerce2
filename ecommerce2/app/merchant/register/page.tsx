"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Input from "../../components/input";
import Button from "../../components/button";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "../../auth/AuthProvider";

export default function MerchantRegisterPage() {
  const router = useRouter();
  const { refreshProfile } = useAuth();
  const [storeName, setStoreName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMsg(null);
    if (!storeName || !email || !password) {
      setMsg("Please fill in all merchant fields.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { role: "merchant", store_name: storeName },
        },
      });

      if (error) {
        setMsg(error.message.includes("already") ? "Account already exists — please login." : error.message);
        setLoading(false);
        return;
      }

      if (data.session) {
        await refreshProfile();
        router.push("/merchant/dashboard");
      } else {
        setMsg("Account created — check your email to confirm, then log in.");
        setLoading(false);
      }
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : "Registration failed.");
      setLoading(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="card p-8">
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700">Merchant signup</p>
          <h1 className="text-3xl font-semibold text-slate-950">Create your merchant account</h1>
          <p className="text-slate-600">Register to manage products stored in Supabase and publish to the global feed.</p>
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
