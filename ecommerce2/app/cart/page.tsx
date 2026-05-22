import Input from "../components/input";
import Button from "../components/button";

export default function cartPage() {
    return (
        <section className="space-y-6">
            <div className="card p-8">
                <div className="space-y-3">
                    <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700">Your cart</p>
                    <h1 className="text-3xl font-semibold text-slate-950">Manage your selections</h1>
                    <p className="text-slate-600">Search for products and review your cart in a clean, modern interface.</p>
                </div>
                <form action="" className="mt-8 grid gap-4 sm:max-w-lg">
                    <Input type="text" name="username" placeholder="Find product..." />
                    <Button type="submit" text="Find it" />
                </form>
            </div>
            <div className="card p-8">
                <h2 className="text-xl font-semibold text-slate-950">Products</h2>
                <p className="mt-3 text-slate-600">Your cart section is ready for product previews and checkout details.</p>
            </div>
        </section>
    );
}