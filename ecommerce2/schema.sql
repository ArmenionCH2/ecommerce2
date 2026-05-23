-- ====================================================================
-- SUPABASE E-COMMERCE DATABASE SCHEMA (Green Market)
-- Paste this into your Supabase SQL Editor (Dashboard > SQL Editor)
-- ====================================================================

-- 1. ENUMS & ROLES
-- Role selection for profiles: customer (shopper) or seller (merchant)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('customer', 'seller');
    END IF;
END $$;

-- 2. PROFILES TABLE
-- Linked to Supabase Auth auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'customer',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. PRODUCTS TABLE
-- Managed by Sellers
CREATE TABLE IF NOT EXISTS public.products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    seller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. CART ITEMS TABLE
-- Managed by Customers (Strictly no local storage, backend-driven)
CREATE TABLE IF NOT EXISTS public.cart_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE (user_id, product_id)
);

-- 5. ORDERS TABLE
-- Created by Customers upon checkout
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    delivery_location TEXT NOT NULL,
    payment_method TEXT NOT NULL DEFAULT 'Cash on Delivery',
    status TEXT NOT NULL DEFAULT 'Pending', -- 'Pending', 'Shipped', 'Delivered', 'Cancelled'
    total_price NUMERIC(10, 2) NOT NULL CHECK (total_price >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 6. ORDER ITEMS TABLE
-- Individual items inside an order
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0)
);

-- ====================================================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- ====================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

-- ---------------------
-- PROFILES POLICIES
-- ---------------------
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- ---------------------
-- PRODUCTS POLICIES
-- ---------------------
CREATE POLICY "Anyone can view products" 
ON public.products FOR SELECT USING (true);

CREATE POLICY "Sellers can insert their own products" 
ON public.products FOR INSERT WITH CHECK (
    auth.uid() = seller_id AND 
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'seller'
    )
);

CREATE POLICY "Sellers can update their own products" 
ON public.products FOR UPDATE USING (
    auth.uid() = seller_id AND 
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'seller'
    )
);

CREATE POLICY "Sellers can delete their own products" 
ON public.products FOR DELETE USING (
    auth.uid() = seller_id AND 
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'seller'
    )
);

-- ---------------------
-- CART ITEMS POLICIES
-- ---------------------
CREATE POLICY "Users can view their own cart items" 
ON public.cart_items FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own cart items" 
ON public.cart_items FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ---------------------
-- ORDERS POLICIES
-- ---------------------
CREATE POLICY "Customers can view their own orders" 
ON public.orders FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "Sellers can view orders containing their products" 
ON public.orders FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.order_items oi
        JOIN public.products p ON oi.product_id = p.id
        WHERE oi.order_id = public.orders.id AND p.seller_id = auth.uid()
    )
);

CREATE POLICY "Customers can place their own orders" 
ON public.orders FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Customers can update/cancel their own orders" 
ON public.orders FOR UPDATE USING (auth.uid() = customer_id) WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Sellers can update order status for their orders" 
ON public.orders FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.order_items oi
        JOIN public.products p ON oi.product_id = p.id
        WHERE oi.order_id = public.orders.id AND p.seller_id = auth.uid()
    )
);

-- ---------------------
-- ORDER ITEMS POLICIES
-- ---------------------
CREATE POLICY "Customers can view their own order items" 
ON public.order_items FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.orders o
        WHERE o.id = order_id AND o.customer_id = auth.uid()
    )
);

CREATE POLICY "Sellers can view order items for their products" 
ON public.order_items FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.products p
        WHERE p.id = product_id AND p.seller_id = auth.uid()
    )
);

CREATE POLICY "Customers can insert their own order items" 
ON public.order_items FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.orders o
        WHERE o.id = order_id AND o.customer_id = auth.uid()
    )
);

-- ====================================================================
-- AUTOMATIC PROFILE TRIGGER (Creates a profile when a user signs up)
-- ====================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, role)
    VALUES (
        new.id,
        new.email,
        COALESCE((new.raw_user_meta_data->>'role')::user_role, 'customer')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cleanup existing trigger/function if needed
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
