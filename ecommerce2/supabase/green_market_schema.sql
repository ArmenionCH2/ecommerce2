-- =============================================================================
-- Green Market — Supabase schema + RLS policies
-- Copy this entire file into: Supabase Dashboard → SQL Editor → Run
--
-- Matches app roles: 'customer' | 'merchant' (see AuthProvider.tsx)
-- Product columns align with merchantStorage.ts → migrate to this table
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. PROFILES (1:1 with auth.users — source of truth for role)
-- -----------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  store_name text,
  role text not null default 'customer' check (role in ('customer', 'merchant')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'App profile linked to Supabase Auth; role drives dashboard vs feed UI';
comment on column public.profiles.role is 'customer = shopper feed; merchant = inventory dashboard';

-- Backfill columns if profiles existed from an older migration
alter table public.profiles add column if not exists store_name text;
alter table public.profiles add column if not exists role text default 'customer';
alter table public.profiles add column if not exists created_at timestamptz default now();
alter table public.profiles add column if not exists updated_at timestamptz default now();

-- -----------------------------------------------------------------------------
-- 2. PRODUCTS (merchants write; customers/guests read published rows)
-- -----------------------------------------------------------------------------

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  description text not null default '',
  quantity integer not null default 1 check (quantity > 0),
  price numeric(10, 2) not null check (price >= 0),
  image_url text,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.products is 'Merchant inventory; published=true appears on global customer feed';

-- Safe upgrades when table already exists without newer columns
alter table public.products add column if not exists name text;
alter table public.products add column if not exists description text default '';
alter table public.products add column if not exists quantity integer default 1;
alter table public.products add column if not exists price numeric(10, 2);
alter table public.products add column if not exists image_url text;
alter table public.products add column if not exists published boolean default true;
alter table public.products add column if not exists created_at timestamptz default now();
alter table public.products add column if not exists updated_at timestamptz default now();

-- FK so PostgREST can relate products → profiles (optional embeds in queries)
alter table public.products drop constraint if exists products_merchant_id_fkey;
alter table public.products
  add constraint products_merchant_id_fkey
  foreign key (merchant_id) references public.profiles (id) on delete cascade;

create index if not exists products_feed_idx
  on public.products (published, created_at desc);

create index if not exists products_merchant_id_idx
  on public.products (merchant_id);

-- -----------------------------------------------------------------------------
-- 3. CART (optional — for customer checkout later)
-- -----------------------------------------------------------------------------

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  quantity integer not null default 1 check (quantity > 0),
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);

create index if not exists cart_items_user_id_idx on public.cart_items (user_id);

-- -----------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY
-- -----------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.cart_items enable row level security;

-- ---- profiles policies ----
drop policy if exists "profiles_select_public" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;

create policy "profiles_select_public"
  on public.profiles for select
  to anon, authenticated
  using (true);

create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ---- products policies ----
drop policy if exists "products_select_published" on public.products;
drop policy if exists "products_select_own" on public.products;
drop policy if exists "products_select_in_cart" on public.products;
drop policy if exists "products_insert_merchant" on public.products;
drop policy if exists "products_update_merchant" on public.products;
drop policy if exists "products_delete_merchant" on public.products;

-- Guests + customers: read published listings (global feed)
create policy "products_select_published"
  on public.products for select
  to anon, authenticated
  using (published = true);

-- Merchants: read all of their own rows (including drafts)
create policy "products_select_own"
  on public.products for select
  to authenticated
  using (auth.uid() = merchant_id);

-- Customers: read products already in their cart (even if unpublished later)
create policy "products_select_in_cart"
  on public.products for select
  to authenticated
  using (
    exists (
      select 1 from public.cart_items
      where cart_items.product_id = products.id
        and cart_items.user_id = auth.uid()
    )
  );

-- Only merchants may create listings
create policy "products_insert_merchant"
  on public.products for insert
  to authenticated
  with check (
    auth.uid() = merchant_id
    and exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'merchant'
    )
  );

create policy "products_update_merchant"
  on public.products for update
  to authenticated
  using (auth.uid() = merchant_id)
  with check (auth.uid() = merchant_id);

create policy "products_delete_merchant"
  on public.products for delete
  to authenticated
  using (auth.uid() = merchant_id);

-- ---- cart policies (customers only in app logic; DB allows any authenticated user) ----
drop policy if exists "cart_select_own" on public.cart_items;
drop policy if exists "cart_insert_own" on public.cart_items;
drop policy if exists "cart_update_own" on public.cart_items;
drop policy if exists "cart_delete_own" on public.cart_items;

create policy "cart_select_own"
  on public.cart_items for select
  to authenticated
  using (auth.uid() = user_id);

create policy "cart_insert_own"
  on public.cart_items for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "cart_update_own"
  on public.cart_items for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "cart_delete_own"
  on public.cart_items for delete
  to authenticated
  using (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- 5. GRANTS (API roles must be allowed; RLS still enforces access)
-- -----------------------------------------------------------------------------

grant usage on schema public to anon, authenticated;

grant select on public.profiles to anon, authenticated;
grant insert, update on public.profiles to authenticated;

grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;

grant select, insert, update, delete on public.cart_items to authenticated;

-- -----------------------------------------------------------------------------
-- 6. AUTO-CREATE PROFILE ON AUTH SIGN-UP
-- Pass role + store_name via signUp options.data, e.g.:
--   supabase.auth.signUp({ email, password, options: { data: { role: 'merchant', store_name: 'My Shop' } } })
-- -----------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, store_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'store_name', new.raw_user_meta_data->>'full_name'),
    coalesce(new.raw_user_meta_data->>'role', 'customer')
  )
  on conflict (id) do update set
    email = excluded.email,
    store_name = coalesce(excluded.store_name, public.profiles.store_name),
    role = coalesce(excluded.role, public.profiles.role),
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- 7. UPDATED_AT helper (optional)
-- -----------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();
