"use client";

import Input from "../../components/input";
import Button from "../../components/button";
import { useRouter } from "next/navigation";
import { useAuth } from "../../auth/AuthProvider";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const { refreshProfile } = useAuth();
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    const fd = new FormData(e.currentTarget as HTMLFormElement);
    const email = (fd.get("username") as string) || "";
    const password = (fd.get("password") as string) || "";

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setMsg("Invalid email or password.");
        setLoading(false);
        return;
      }

      await refreshProfile();
      router.push("/");
      router.refresh();
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="card p-8">
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700">Secure access</p>
          <h1 className="text-3xl font-semibold text-slate-950">Customer login</h1>
          <p className="text-slate-600">Sign in to shop and use your cart.</p>
        </div>
        <form onSubmit={onSubmit} className="mt-8 grid gap-4 sm:max-w-md">
          {msg ? <div className="text-sm text-amber-700">{msg}</div> : null}
          <Input type="email" name="username" placeholder="Email..." />
          <Input type="password" name="password" placeholder="Password..." />
          <Button type="submit" text={loading ? "Please wait..." : "Login"} />
        </form>
      </div>
    </section>
  );
}
