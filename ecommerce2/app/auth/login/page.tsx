import Input from "../../components/input";
import Button from "../../components/button";
import { loginFunc } from "./login";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const params = await searchParams;

  return (
    <section className="space-y-6">
      <div className="card p-8">
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700">
            Secure access
          </p>
          <h1 className="text-3xl font-semibold text-slate-950">Login to your account</h1>
          <p className="text-slate-600">
            Sign in with your Supabase account to shop or manage merchant products.
          </p>
        </div>

        {params.error && (
          <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800">{params.error}</p>
        )}
        {params.message && (
          <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {params.message}
          </p>
        )}

        <form action={loginFunc} className="mt-8 grid gap-4 sm:max-w-md">
          <Input type="email" name="email" placeholder="Email..." />
          <Input type="password" name="password" placeholder="Password..." />
          <Button type="submit" text="Login" />
        </form>
      </div>
    </section>
  );
}
