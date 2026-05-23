"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function registerFunc(formData: FormData) {
  const email = (formData.get("email") as string) || "";
  const password = (formData.get("password") as string) || "";
  const role = (formData.get("role") as string) || "customer";

  // 1. Get access to the Next.js cookie jar
  const cookieStore = await cookies();

  // 2. Create the Supabase client right here on the fly
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Safe to ignore if called from a layout or page component
          }
        },
      },
    }
  );

  // 3. Run your sign up function
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { role },
    },
  });

  if (error) {
    console.error("Signup failed:", error.message);
    return redirect("/auth/login?error=Registration failed");
  }

  return redirect("/?message=Check your email to confirm registration");
}