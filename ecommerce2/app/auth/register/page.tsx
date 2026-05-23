"use client";

import Input from "../../components/input";
import Button from "../../components/button";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "../../auth/AuthProvider";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { refreshProfile } = useAuth();
  const router = useRouter();

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    const fd = new FormData(e.currentTarget as HTMLFormElement);
    const email = (fd.get("email") as string) || "";
    const password = (fd.get("password") as string) || "";

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { role: "customer" } },
      });

      if (error) {
        const text = error.message?.toLowerCase().includes("already")
          ? "Account already exists — please login."
          : `Registration error: ${error.message}`;
        setMsg(text);
        setLoading(false);
        return;
      }

      if (data?.session) {
        await refreshProfile();
        router.push("/");
        router.refresh();
      } else {
        setMsg("Registered — check your email to confirm your account.");
      }
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="card p-8">
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700">Join the market</p>
          <h1 className="text-3xl font-semibold text-slate-950">Create your customer account</h1>
          <p className="text-slate-600">Register to save your cart and shop from the product feed.</p>
        </div>
        <form onSubmit={onSubmit} className="mt-8 grid gap-4 sm:max-w-md">
          {msg ? <div className="text-sm text-amber-700">{msg}</div> : null}
          <Input type="email" name="email" placeholder="Email..." />
          <Input type="password" name="password" placeholder="Password..." />
          <Button type="submit" text={loading ? "Please wait..." : "Register"} />
        </form>
      </div>
    </section>
  );
}
