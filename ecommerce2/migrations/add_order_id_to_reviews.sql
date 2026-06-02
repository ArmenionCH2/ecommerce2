-- Migration: Add order_id to reviews table
-- Purpose: Allow one review per product per order (instead of per customer)

-- 1. Add order_id column to reviews table (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reviews' AND column_name = 'order_id'
  ) THEN
    ALTER TABLE public.reviews ADD COLUMN order_id bigint;
  END IF;
END $$;

-- 2. Add foreign key constraint for order_id (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'reviews_order_id_fkey'
  ) THEN
    ALTER TABLE public.reviews ADD CONSTRAINT reviews_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);
  END IF;
END $$;

-- 3. Drop the existing unique constraint on (product_id, customer_id)
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_product_id_customer_id_key;

-- 4. Add new unique constraint on (product_id, customer_id, order_id) (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'reviews_product_id_customer_id_order_id_key'
  ) THEN
    ALTER TABLE public.reviews ADD CONSTRAINT reviews_product_id_customer_id_order_id_key UNIQUE (product_id, customer_id, order_id);
  END IF;
END $$;

-- 5. Add updated_at column to track edits
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone;

-- 6. Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_reviews_order_id ON public.reviews(order_id);
