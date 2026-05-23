-- Run this if you see: column "published" does not exist
-- (Usually means public.products was created before that column was added.)

-- 1) Add missing columns on an existing products table
alter table public.products
  add column if not exists description text not null default '';

alter table public.products
  add column if not exists image_url text;

alter table public.products
  add column if not exists published boolean not null default true;

alter table public.products
  add column if not exists created_at timestamptz not null default now();

-- 2) Backfill: treat existing rows as published so they show in the feed
update public.products
set published = true
where published is null;

-- 3) Index used by the feed (safe to re-run)
create index if not exists products_published_created_idx
  on public.products (published, created_at desc);

-- 4) Re-apply the policy that references published
drop policy if exists "Published products are public" on public.products;

create policy "Published products are public"
  on public.products
  for select
  to authenticated, anon
  using (
    published = true
    or auth.uid() = merchant_id
  );
