-- Migration: Add order_id to reviews table
-- Purpose: Allow one review per product per order (instead of per customer)

-- 1. Add order_id column to reviews table
ALTER TABLE public.reviews ADD COLUMN order_id bigint;

-- 2. Add foreign key constraint for order_id
ALTER TABLE public.reviews ADD CONSTRAINT reviews_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);

-- 3. Drop the existing unique constraint on (product_id, customer_id)
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_product_id_customer_id_key;

-- 4. Add new unique constraint on (product_id, customer_id, order_id)
ALTER TABLE public.reviews ADD CONSTRAINT reviews_product_id_customer_id_order_id_key UNIQUE (product_id, customer_id, order_id);

-- 5. Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_reviews_order_id ON public.reviews(order_id);
