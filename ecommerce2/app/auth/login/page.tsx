"use client";

import Input from "../../components/input";
import Button from "../../components/button";
import { loginFunc } from "./login";

export default function LoginPage() {
  return (
    <section className="space-y-6">
      <div className="card p-8">
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700">Secure access</p>
          <h1 className="text-3xl font-semibold text-slate-950">Login to your account</h1>
          <p className="text-slate-600">Enter your credentials to continue shopping with a polished modern experience.</p>
        </div>
        <form action={loginFunc} className="mt-8 grid gap-4 sm:max-w-md">
          <Input type="email" name="email" placeholder="Email" />
          <Input type="password" name="password" placeholder="Password" />
          <Button type="submit" text="Login" />
        </form>
      </div>
    </section>
  );
}
