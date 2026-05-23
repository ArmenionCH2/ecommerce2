-- Ensures PostgREST can relate products.merchant_id → profiles.id
-- (Optional if the app uses separate queries; safe to run.)

alter table public.products
  drop constraint if exists products_merchant_id_fkey;

alter table public.products
  add constraint products_merchant_id_fkey
  foreign key (merchant_id)
  references public.profiles (id)
  on delete cascade;
