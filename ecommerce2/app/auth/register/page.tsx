import Input from "../../components/input";
import Button from "../../components/button";
import { registerFunc } from "./register";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <section className="space-y-6">
      <div className="card p-8">
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700">
            Join the market
          </p>
          <h1 className="text-3xl font-semibold text-slate-950">Create your account</h1>
          <p className="text-slate-600">
            Register as a buyer to shop, or as a merchant to list products in the public feed.
          </p>
        </div>

        {params.error && (
          <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800">{params.error}</p>
        )}

        <form action={registerFunc} className="mt-8 grid gap-4 sm:max-w-md">
          <Input type="email" name="email" placeholder="Email..." />
          <Input type="password" name="password" placeholder="Password..." />
          <label className="grid gap-2 text-sm text-slate-700">
            <span className="font-medium">Account type</span>
            <select
              name="role"
              className="w-full rounded-3xl border border-emerald-200 bg-white/90 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition duration-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              defaultValue="buyer"
            >
              <option value="buyer">Buyer — browse and purchase</option>
              <option value="merchant">Merchant — post products to the feed</option>
            </select>
          </label>
          <Button type="submit" text="Register" />
        </form>
      </div>
    </section>
  );
}
