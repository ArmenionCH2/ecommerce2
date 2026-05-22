-- Enable the pgcrypto extension for UUID generation
create extension if not exists "pgcrypto";

-- Merchant profile table, linked to Supabase auth users
create table if not exists merchants (
  id uuid default gen_random_uuid() primary key,
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  email text not null unique,
  store_name text not null,
  created_at timestamptz default now()
);

-- Product catalog table for merchant products
create table if not exists products (
  id uuid default gen_random_uuid() primary key,
  merchant_id uuid not null references merchants(id) on delete cascade,
  name text not null,
  quantity integer not null default 0,
  price numeric(10,2) not null default 0,
  photo text,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists products_merchant_id_idx on products(merchant_id);
