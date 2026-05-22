"use client";

import Input from "../../components/input";
import Button from "../../components/button";
import { useRouter } from "next/navigation";
import { useAuth } from "../../auth/AuthProvider";
import React from "react";

export default function LoginPage() {
    const router = useRouter();
    const { login } = useAuth();

    const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget as HTMLFormElement);
        const username = (fd.get("username") as string) || "";
        login({ email: username });
        router.push("/");
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
                    <Input type="text" name="username" placeholder="Username or email..." />
                    <Input type="password" name="password" placeholder="Password..." />
                    <Button type="submit" text="Login" />
                </form>
            </div>
        </section>
    );
}