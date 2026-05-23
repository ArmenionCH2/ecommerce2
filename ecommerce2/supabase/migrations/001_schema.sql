-- =============================================================================
-- Green Market — Supabase schema + Row Level Security
-- Run once in: Supabase Dashboard → SQL Editor → New query → Run
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. TABLES (persistent storage for profiles, products, cart)
-- -----------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'buyer' check (role in ('buyer', 'merchant')),
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text not null default '',
  price numeric(10, 2) not null check (price >= 0),
  image_url text,
  published boolean not null default true,
  created_at timestamptz not null default now()
);

-- If products already existed without these columns, CREATE TABLE IF NOT EXISTS
-- does nothing — add columns explicitly (fixes "column published does not exist").
alter table public.products
  add column if not exists description text not null default '';

alter table public.products
  add column if not exists image_url text;

alter table public.products
  add column if not exists published boolean not null default true;

alter table public.products
  add column if not exists created_at timestamptz not null default now();

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  quantity integer not null default 1 check (quantity > 0),
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);

-- Indexes for feed + merchant dashboard + cart lookups
create index if not exists products_published_created_idx
  on public.products (published, created_at desc);

create index if not exists products_merchant_id_idx
  on public.products (merchant_id);

create index if not exists cart_items_user_id_idx
  on public.cart_items (user_id);

-- -----------------------------------------------------------------------------
-- 2. ROW LEVEL SECURITY — enable on all app tables
-- -----------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.cart_items enable row level security;

-- -----------------------------------------------------------------------------
-- 3. POLICIES — drop old names so this script is safe to re-run
-- -----------------------------------------------------------------------------

-- profiles
drop policy if exists "Profiles are viewable by everyone" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;

create policy "Profiles are viewable by everyone"
  on public.profiles
  for select
  to authenticated, anon
  using (true);

create policy "Users can insert own profile"
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- products
drop policy if exists "Merchants can insert own products" on public.products;
drop policy if exists "Merchants can update own products" on public.products;
drop policy if exists "Merchants can delete own products" on public.products;
drop policy if exists "Published products are public" on public.products;
drop policy if exists "Users can view products in own cart" on public.products;

-- Anyone (including guests) can read published listings for the feed
create policy "Published products are public"
  on public.products
  for select
  to authenticated, anon
  using (
    published = true
    or auth.uid() = merchant_id
  );

-- Buyers can still read product details for items already in their cart
create policy "Users can view products in own cart"
  on public.products
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.cart_items
      where cart_items.product_id = products.id
        and cart_items.user_id = auth.uid()
    )
  );

-- Only merchant accounts can create listings (stored under their user id)
create policy "Merchants can insert own products"
  on public.products
  for insert
  to authenticated
  with check (
    auth.uid() = merchant_id
    and exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'merchant'
    )
  );

create policy "Merchants can update own products"
  on public.products
  for update
  to authenticated
  using (auth.uid() = merchant_id)
  with check (auth.uid() = merchant_id);

create policy "Merchants can delete own products"
  on public.products
  for delete
  to authenticated
  using (auth.uid() = merchant_id);

-- cart_items
drop policy if exists "Users can view own cart" on public.cart_items;
drop policy if exists "Users can insert own cart items" on public.cart_items;
drop policy if exists "Users can update own cart" on public.cart_items;
drop policy if exists "Users can delete own cart items" on public.cart_items;

create policy "Users can view own cart"
  on public.cart_items
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own cart items"
  on public.cart_items
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own cart"
  on public.cart_items
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own cart items"
  on public.cart_items
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- 4. GRANTS — allow API roles to read/write through RLS
-- -----------------------------------------------------------------------------

grant usage on schema public to anon, authenticated;

grant select on public.profiles to anon, authenticated;
grant select on public.products to anon, authenticated;

grant insert, update on public.profiles to authenticated;
grant insert, update, delete on public.products to authenticated;
grant select, insert, update, delete on public.cart_items to authenticated;

-- -----------------------------------------------------------------------------
-- 5. AUTH TRIGGER — auto-save profile row when a user registers
-- -----------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'buyer')
  )
  on conflict (id) do update
    set email = excluded.email,
        role = coalesce(excluded.role, public.profiles.role);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
