-- Ecommerce database schema for Supabase
-- Includes profiles, products, carts, orders, and row-level security policies.

-- 1. Role enum for customer / seller separation
CREATE TYPE public.user_role AS ENUM ('customer', 'seller');

-- 2. Profiles table linked to Supabase Auth users
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role public.user_role NOT NULL DEFAULT 'customer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 3. Products table for seller-owned inventory
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 4. Cart items for customer shopping carts
CREATE TABLE public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE(user_id, product_id)
);

-- 5. Orders and order items for checkout history
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  shipping_address TEXT NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'cash_on_delivery',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 1,
  price NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 6. Enable row level security for public tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- 7. Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 8. Products policies
CREATE POLICY "Anyone can view products"
  ON public.products FOR SELECT USING (true);

CREATE POLICY "Sellers can insert their own products"
  ON public.products FOR INSERT WITH CHECK (
    auth.uid() = seller_id AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'seller')
  );

CREATE POLICY "Sellers can update their own products"
  ON public.products FOR UPDATE USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can delete their own products"
  ON public.products FOR DELETE USING (auth.uid() = seller_id);

-- 9. Cart policies
CREATE POLICY "Customers can view their own cart"
  ON public.cart_items FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Customers can manage their own cart"
  ON public.cart_items FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Customers can update their own cart items"
  ON public.cart_items FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Customers can remove their own cart items"
  ON public.cart_items FOR DELETE USING (auth.uid() = user_id);

-- 10. Orders policies
CREATE POLICY "Customers can view their own orders"
  ON public.orders FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Customers can create their own orders"
  ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Customers can update their own orders"
  ON public.orders FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view order items for their orders"
  ON public.order_items FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders WHERE id = order_items.order_id AND user_id = auth.uid()
    )
  );

-- 11. Trigger to create a profile automatically when a Supabase auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'customer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
