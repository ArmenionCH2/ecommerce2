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
        const email = (fd.get("email") as string) || "";
        const role = (fd.get("role") as string) as "customer" | "seller";
        login({ email, role });
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
                    <Input type="email" name="email" placeholder="Email..." />
                    <Input type="password" name="password" placeholder="Password..." />
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="role">
                            Continue as
                        </label>
                        <select
                            id="role"
                            name="role"
                            defaultValue="customer"
                            className="w-full rounded-3xl border border-emerald-200 bg-white/90 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition duration-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                        >
                            <option value="customer">Customer</option>
                            <option value="seller">Seller</option>
                        </select>
                    </div>
                    <Button type="submit" text="Login" />
                </form>
            </div>
        </section>
    );
}