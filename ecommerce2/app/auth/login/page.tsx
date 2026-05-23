import Input from "../../components/input";
import Button from "../../components/button";
import { loginAction } from "../actions";

export default function LoginPage() {

    return (
        <section className="space-y-6">
            <div className="card p-8">
                <div className="space-y-3">
                    <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700">Secure access</p>
                    <h1 className="text-3xl font-semibold text-slate-950">Login to your account</h1>
                    <p className="text-slate-600">Enter your credentials to continue shopping with a polished modern experience.</p>
                </div>
                <form action={loginAction} className="mt-8 grid gap-4 sm:max-w-md">
                    <Input type="email" name="email" placeholder="Email..." />
                    <Input type="password" name="password" placeholder="Password..." />
                    <div className="rounded-3xl border border-emerald-200 bg-white/90 px-4 py-3 shadow-sm">
                        <label className="mb-2 block text-sm font-medium text-slate-700">Login as</label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 text-sm text-slate-700">
                                <input type="radio" name="role" value="customer" defaultChecked />
                                Customer
                            </label>
                            <label className="flex items-center gap-2 text-sm text-slate-700">
                                <input type="radio" name="role" value="seller" />
                                Seller
                            </label>
                        </div>
                    </div>
                    <Button type="submit" text="Login" />
                </form>
            </div>
        </section>
    );
}