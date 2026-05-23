import Input from "@/app/components/input";
import Button from "@/app/components/button";
import { requireMerchantProfile } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createProduct } from "../../actions";

export default async function NewProductPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const profile = await requireMerchantProfile();
  if (!profile) redirect("/auth/login?error=Merchant account required");

  const params = await searchParams;

  return (
    <section className="space-y-6">
      <div className="card p-8">
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700">
            New listing
          </p>
          <h1 className="text-3xl font-semibold text-slate-950">Post a product</h1>
          <p className="text-slate-600">Saved to Supabase and shown in the shopper feed when published.</p>
        </div>

        {params.error && (
          <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800">{params.error}</p>
        )}

        <form action={createProduct} className="mt-8 grid max-w-lg gap-4">
          <Input type="text" name="title" placeholder="Product title" minLength={2} />
          <label className="grid gap-2 text-sm text-slate-700">
            <span className="font-medium">Description</span>
            <textarea
              name="description"
              required
              rows={4}
              placeholder="Describe your product..."
              className="w-full rounded-3xl border border-emerald-200 bg-white/90 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            />
          </label>
          <Input type="number" name="price" placeholder="Price (USD)" step="0.01" />
          <Input type="text" name="image_url" placeholder="Image URL (optional)" required={false} minLength={0} />
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" name="published" defaultChecked className="h-4 w-4 rounded border-emerald-300" />
            Publish to feed immediately
          </label>
          <Button type="submit" text="Save product" />
        </form>
      </div>
    </section>
  );
}
