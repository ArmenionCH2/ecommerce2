# Supabase setup

All app data (profiles, products, cart) lives in Postgres. Row Level Security (RLS) policies control who can read and write each row.

## 1. Environment

Copy `.env.example` to `.env.local` in the `ecommerce2` folder:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

Get both values from **Project Settings → API** in the Supabase dashboard.

## 2. Run the SQL migration

1. Open your project in [Supabase Dashboard](https://supabase.com/dashboard).
2. Go to **SQL Editor → New query**.
3. Paste the **entire** contents of `migrations/001_schema.sql`.
4. Click **Run**.

You should see success with no errors. The script creates:

| Table        | Stores                                      |
|-------------|---------------------------------------------|
| `profiles`  | User role (buyer/merchant), email             |
| `products`  | Merchant listings (feed + dashboard)        |
| `cart_items`| Per-user cart lines                           |

It also enables **RLS** and policies so:

- Published products are readable by everyone (feed).
- Merchants can only insert/update/delete their own products.
- Users can only see and change their own cart rows.
- Profiles are created automatically on sign-up.

The script is safe to **re-run** (policies are dropped and recreated).

## 3. Verify in the dashboard

After running SQL:

- **Table Editor** → you should see `profiles`, `products`, `cart_items`.
- **Authentication → Policies** → each table should list the policies from the migration.

## 4. Local dev

```bash
npm run dev
```

Optional: disable email confirmation under **Authentication → Providers → Email** for faster testing.

## 5. Test flow

1. Register as **Merchant** → sign in.
2. **Merchant** → **Add product** → save (check Table Editor → `products` has a row).
3. Home **Feed** shows the listing.
4. Register as **Buyer** → **Add to cart** → **Cart** (check `cart_items` in Table Editor).

## Troubleshooting

| Problem | Fix |
|--------|-----|
| **`column "published" does not exist`** | Run **`migrations/002_fix_products_published.sql`**. |
| **Registered as merchant but see Feed/Cart** | Log out and back in (role syncs from sign-up metadata). Or run: `update public.profiles set role = 'merchant' where email = 'you@example.com';` |
| **Relationship products / profiles error** | Fixed in app code; optional: run **`003_products_profiles_fk.sql`**. |
| “Could not load products” on feed | Run `001_schema.sql`; confirm `.env.local` keys match the project |
| Merchant can’t save product | User must be role `merchant` in `profiles`; re-register as merchant or update role in Table Editor |
| Empty `profiles` after sign-up | Re-run SQL (trigger section); sign up a new user |
| Policies missing | Re-run full `001_schema.sql` |

### Check whether `published` exists

```sql
select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'products'
order by ordinal_position;
```

You should see `published` in the list. If not, run `002_fix_products_published.sql`.
