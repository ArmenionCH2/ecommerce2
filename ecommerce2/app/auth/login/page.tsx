"use client";

import Input from "../../components/input";
import Button from "../../components/button";
import { useRouter } from "next/navigation";
import { useAuth } from "../../auth/AuthProvider";
import React, { useState } from "react";
import getSupabaseClient from "../../lib/supabaseClient";

export default function LoginPage() {
    const router = useRouter();
    const { login } = useAuth();
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
            const supabase = getSupabaseClient();
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                // Try to register if sign-in failed (user may not exist)
                const { data: regData, error: regError } = await supabase.auth.signUp({
                    email,
                    password,
                });

                if (regError) {
                    // If user already exists, tell them; else show generic error
                    const msgText = regError.message?.includes("already")
                        ? "Account already exists — try logging in."
                        : `Auth error: ${regError.message}`;
                    setMsg(msgText);
                    setLoading(false);
                    return;
                }

                // Registration succeeded — prompt email confirm if needed
                setMsg("Registered — check your email to confirm, then login.");
                setLoading(false);
                return;
            }

            // Successful login
            const user = data.user;
            if (user) {
                login({ email: user.email ?? undefined, name: user.user_metadata?.full_name });
            }
            router.push("/");
        } catch (err: any) {
            setMsg(err?.message || String(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="space-y-6">
            <div className="card p-8">
                <div className="space-y-3">
                    <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700">Secure access</p>
                    <h1 className="text-3xl font-semibold text-slate-950">Login to your account</h1>
                    <p className="text-slate-600">Enter your credentials to continue shopping with a polished modern experience.</p>
                </div>
                <form onSubmit={onSubmit} className="mt-8 grid gap-4 sm:max-w-md">
                    {msg ? <div className="text-sm text-amber-700">{msg}</div> : null}
                    <Input type="text" name="username" placeholder="Email..." />
                    <Input type="password" name="password" placeholder="Password..." />
                    <Button type="submit" text={loading ? "Please wait..." : "Login / Register"} />
                </form>
            </div>
        </section>
    );
}