import Input from "../../components/input";
import Button from "../../components/button";

import { registerFunc } from "./register";


export default function RegisterPage() {
    return (
        <section className="space-y-6">
            <div className="card p-8">
                <div className="space-y-3">
                    <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700">Join the market</p>
                    <h1 className="text-3xl font-semibold text-slate-950">Create your account</h1>
                    <p className="text-slate-600">Register now to save your cart and enjoy faster checkout.</p>
                </div>
                <form action={registerFunc} className="mt-8 grid gap-4 sm:max-w-md">
                    <Input type="email" name="email" placeholder="Email..." />
                    <Input type="password" name="password" placeholder="Password..." />
                    <Button type="submit" text="Register" />
                </form>
            </div>
        </section>
    );
}