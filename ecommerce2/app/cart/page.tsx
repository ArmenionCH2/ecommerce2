import Link from "next/link";
import { createServerSupabaseClient } from "../lib/supabaseServer";

export default async function CartPage() {
    const supabase = createServerSupabaseClient();
    const {
        data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
        return (
            <section className="space-y-6">
                <div className="card p-8">
                    <div className="space-y-3">
                        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700">Your cart</p>
                        <h1 className="text-3xl font-semibold text-slate-950">Please sign in</h1>
                        <p className="text-slate-600">Login as a customer to view your cart and saved products.</p>
                    </div>
                    <div className="mt-8 flex flex-wrap gap-3">
                        <Link href="/auth/login" className="rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700">
                            Login
                        </Link>
                        <Link href="/auth/register" className="rounded-full border border-emerald-600 px-6 py-3 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">
                            Register
                        </Link>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="space-y-6">
            <div className="card p-8">
                <div className="space-y-3">
                    <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700">Your cart</p>
                    <h1 className="text-3xl font-semibold text-slate-950">Review your selections</h1>
                    <p className="text-slate-600">Your cart is waiting for products from the public marketplace.</p>
                </div>
                <div className="mt-8 rounded-3xl border border-emerald-100 bg-emerald-50 p-6 text-slate-700">
                    Cart integration is ready. Browse products and the cart will show your saved items here.
                </div>
            </div>
        </section>
    );
}