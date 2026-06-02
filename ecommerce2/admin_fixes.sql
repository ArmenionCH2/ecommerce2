-- ============================================
-- Admin Panel Fixes - SQL Script
-- Run this in Supabase SQL Editor
-- ============================================

-- Fix 1: Create refunds_disputes table
CREATE TABLE IF NOT EXISTS public.refunds_disputes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id bigint NOT NULL,
  customer_id uuid NOT NULL,
  seller_id uuid NOT NULL,
  refund_amount numeric NOT NULL,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status = ANY (ARRAY['pending','approved','rejected','processed'])),
  dispute_type text NOT NULL DEFAULT 'refund' CHECK (dispute_type = ANY (ARRAY['refund','dispute','return'])),
  admin_notes text,
  processed_by uuid,
  processed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT refunds_disputes_pkey PRIMARY KEY (id),
  CONSTRAINT refunds_disputes_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id),
  CONSTRAINT refunds_disputes_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.profiles(id),
  CONSTRAINT refunds_disputes_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.profiles(id),
  CONSTRAINT refunds_disputes_processed_by_fkey FOREIGN KEY (processed_by) REFERENCES public.profiles(id)
);

-- RLS for refunds_disputes
ALTER TABLE public.refunds_disputes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Admins full access to refunds_disputes" ON public.refunds_disputes;
DROP POLICY IF EXISTS "Customers can create refund disputes" ON public.refunds_disputes;
DROP POLICY IF EXISTS "Customers can view their own disputes" ON public.refunds_disputes;
DROP POLICY IF EXISTS "Sellers can view disputes involving them" ON public.refunds_disputes;

-- Admins can do everything
CREATE POLICY "Admins full access to refunds_disputes"
  ON public.refunds_disputes
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Customers can insert their own disputes
CREATE POLICY "Customers can create refund disputes"
  ON public.refunds_disputes
  FOR INSERT
  WITH CHECK (customer_id = auth.uid());

-- Customers can read their own disputes
CREATE POLICY "Customers can view their own disputes"
  ON public.refunds_disputes
  FOR SELECT
  USING (customer_id = auth.uid());

-- Sellers can read disputes involving them
CREATE POLICY "Sellers can view disputes involving them"
  ON public.refunds_disputes
  FOR SELECT
  USING (seller_id = auth.uid());

-- Fix 2: Create seller_performance view
CREATE OR REPLACE VIEW public.seller_performance AS
SELECT
  oi.seller_id,
  COUNT(DISTINCT o.id)::integer AS total_orders,
  COALESCE(SUM(oi.price_at_purchase * oi.quantity), 0) AS total_revenue,
  ROUND(
    COALESCE(
      AVG(EXTRACT(EPOCH FROM (
        CASE 
          WHEN o.status = 'received' THEN o.updated_at - o.created_at
          WHEN o.status IN ('packed','to_receive') THEN now() - o.created_at
          ELSE NULL
        END
      )) / 3600.0
    ), 0)
  , 1) AS average_fulfillment_time_hours,
  COALESCE(
    COUNT(DISTINCT CASE WHEN o.status = 'cancelled' THEN o.id END)::numeric /
    NULLIF(COUNT(DISTINCT o.id), 0)
  , 0) AS return_rate,
  COALESCE(ROUND(AVG(r.rating)::numeric, 2), 0) AS average_rating,
  COUNT(DISTINCT r.id)::integer AS total_reviews
FROM public.order_items oi
JOIN public.orders o ON o.id = oi.order_id
LEFT JOIN public.reviews r ON r.product_id = oi.product_id
GROUP BY oi.seller_id;

-- Grant read access to authenticated users
GRANT SELECT ON public.seller_performance TO authenticated;

-- Fix 3: Create RPC function for search trends (optional but recommended)
CREATE OR REPLACE FUNCTION public.upsert_search_trend(query_text text)
RETURNS void AS $$
BEGIN
  INSERT INTO public.search_trends (search_query, search_count, last_searched_at)
  VALUES (lower(trim(query_text)), 1, now())
  ON CONFLICT (search_query)
  DO UPDATE SET
    search_count = search_trends.search_count + 1,
    last_searched_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.upsert_search_trend(text) TO anon, authenticated;

-- Fix 5: Create trigger to populate customer_ltv
CREATE OR REPLACE FUNCTION public.refresh_customer_ltv()
RETURNS trigger AS $$
DECLARE
  v_customer_id uuid;
  v_total_orders integer;
  v_total_spent numeric;
  v_avg_order_value numeric;
  v_first_purchase timestamp with time zone;
  v_last_purchase timestamp with time zone;
  v_days_since integer;
  v_is_vip boolean;
BEGIN
  v_customer_id := NEW.customer_id;

  SELECT
    COUNT(*)::integer,
    COALESCE(SUM(total_amount - 100), 0),
    COALESCE(AVG(total_amount - 100), 0),
    MIN(created_at),
    MAX(created_at)
  INTO v_total_orders, v_total_spent, v_avg_order_value, v_first_purchase, v_last_purchase
  FROM public.orders
  WHERE customer_id = v_customer_id
    AND status != 'cancelled';

  v_days_since := EXTRACT(DAY FROM now() - v_last_purchase)::integer;
  v_is_vip := v_total_spent >= 5000 OR v_total_orders >= 10;

  INSERT INTO public.customer_ltv (
    customer_id, total_orders, total_spent, average_order_value,
    first_purchase_date, last_purchase_date, days_since_last_purchase, is_vip, updated_at
  )
  VALUES (
    v_customer_id, v_total_orders, v_total_spent, v_avg_order_value,
    v_first_purchase, v_last_purchase, v_days_since, v_is_vip, now()
  )
  ON CONFLICT (customer_id)
  DO UPDATE SET
    total_orders = EXCLUDED.total_orders,
    total_spent = EXCLUDED.total_spent,
    average_order_value = EXCLUDED.average_order_value,
    first_purchase_date = EXCLUDED.first_purchase_date,
    last_purchase_date = EXCLUDED.last_purchase_date,
    days_since_last_purchase = EXCLUDED.days_since_last_purchase,
    is_vip = EXCLUDED.is_vip,
    updated_at = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trg_refresh_customer_ltv ON public.orders;

CREATE TRIGGER trg_refresh_customer_ltv
  AFTER INSERT OR UPDATE OF status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.refresh_customer_ltv();

-- Fix 6a: Create trigger to credit seller balances when order is received
CREATE OR REPLACE FUNCTION public.credit_seller_on_order_received()
RETURNS trigger AS $$
DECLARE
  v_seller_id uuid;
  v_gross numeric;
  v_platform_fee_pct numeric := 0.08; -- 8% platform fee (matches PLATFORM_FEE_PERCENTAGE in constants.ts)
  v_platform_fee numeric;
  v_seller_amount numeric;
BEGIN
  IF NEW.status = 'received' AND OLD.status IS DISTINCT FROM 'received' THEN
    -- Loop through each seller's items in this order
    FOR v_seller_id, v_gross IN
      SELECT
        oi.seller_id,
        SUM(oi.price_at_purchase * oi.quantity)
      FROM public.order_items oi
      WHERE oi.order_id = NEW.id
      GROUP BY oi.seller_id
    LOOP
      v_platform_fee  := ROUND(v_gross * v_platform_fee_pct, 2);
      v_seller_amount := v_gross - v_platform_fee;

      -- Credit seller
      INSERT INTO public.seller_balances (seller_id, available_balance, pending_balance, total_earnings)
      VALUES (v_seller_id, v_seller_amount, 0, v_seller_amount)
      ON CONFLICT (seller_id)
      DO UPDATE SET
        available_balance = seller_balances.available_balance + v_seller_amount,
        total_earnings    = seller_balances.total_earnings + v_seller_amount,
        updated_at        = now();

      -- Record platform's cut
      INSERT INTO public.order_fees (order_id, platform_fee, seller_payout, fee_percentage)
      VALUES (NEW.id, v_platform_fee, v_seller_amount, v_platform_fee_pct);
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trg_credit_seller_on_received ON public.orders;

CREATE TRIGGER trg_credit_seller_on_received
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.credit_seller_on_order_received();

-- Fix 6b: Create trigger to deduct seller balances on payout completion
CREATE OR REPLACE FUNCTION public.deduct_balance_on_payout_complete()
RETURNS trigger AS $$
BEGIN
  -- Only act when status transitions TO 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
    UPDATE public.seller_balances
    SET
      available_balance = GREATEST(available_balance - NEW.amount, 0),
      updated_at = now()
    WHERE seller_id = NEW.seller_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trg_deduct_balance_on_payout_complete ON public.seller_payouts;

CREATE TRIGGER trg_deduct_balance_on_payout_complete
  AFTER UPDATE OF status ON public.seller_payouts
  FOR EACH ROW
  EXECUTE FUNCTION public.deduct_balance_on_payout_complete();

-- Fix 7: Create trigger to deduct seller balances on refund approval
CREATE OR REPLACE FUNCTION public.deduct_seller_on_refund_approved()
RETURNS trigger AS $$
BEGIN
  -- Only fire when status transitions TO 'approved'
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN
    UPDATE public.seller_balances
    SET
      available_balance = GREATEST(available_balance - NEW.refund_amount, 0),
      updated_at        = now()
    WHERE seller_id = NEW.seller_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_deduct_seller_on_refund_approved ON public.refunds_disputes;

CREATE TRIGGER trg_deduct_seller_on_refund_approved
  AFTER UPDATE OF status ON public.refunds_disputes
  FOR EACH ROW EXECUTE FUNCTION public.deduct_seller_on_refund_approved();

-- Fix 8: Notification System
-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id          uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL,
  type        text NOT NULL,
  title       text NOT NULL,
  message     text NOT NULL,
  link        text,
  is_read     boolean NOT NULL DEFAULT false,
  created_at  timestamp with time zone DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);

-- Index for fast unread queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON public.notifications (user_id, is_read, created_at DESC);

-- RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Service can insert notifications" ON public.notifications;

-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid());

-- Users can mark their own notifications as read
CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid());

-- Service role (triggers/functions) can insert notifications for anyone
CREATE POLICY "Service can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

-- Helper function to insert notifications
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id uuid,
  p_type    text,
  p_title   text,
  p_message text,
  p_link    text DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, link)
  VALUES (p_user_id, p_type, p_title, p_message, p_link);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.create_notification(uuid, text, text, text, text) TO authenticated;

-- Enable realtime for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Fix: Add RLS policies for admin_audit_log
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read audit log" ON public.admin_audit_log;
DROP POLICY IF EXISTS "Admins can write audit log" ON public.admin_audit_log;

CREATE POLICY "Admins can read audit log"
  ON public.admin_audit_log FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can write audit log"
  ON public.admin_audit_log FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Fix: Add RLS UPDATE policy for customers to mark orders as received
DROP POLICY IF EXISTS "Customers can mark own orders as received" ON public.orders;

CREATE POLICY "Customers can mark own orders as received"
  ON public.orders FOR UPDATE
  USING (customer_id = auth.uid())
  WITH CHECK (customer_id = auth.uid() AND status = 'received');

-- Fix: Add RLS UPDATE policy for customers to update own profile
DROP POLICY IF EXISTS "Customers can update own profile" ON public.profiles;

CREATE POLICY "Customers can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Trigger: notify seller when a new order contains their product
CREATE OR REPLACE FUNCTION public.notify_seller_new_order()
RETURNS trigger AS $$
DECLARE
  v_total numeric;
BEGIN
  SELECT total_amount INTO v_total FROM public.orders WHERE id = NEW.order_id;

  PERFORM public.create_notification(
    NEW.seller_id,
    'NEW_ORDER',
    'New Order Received',
    'You have a new order #' || NEW.order_id || ' worth ₱' || v_total::text,
    '/seller/orders'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_seller_new_order ON public.orders;
DROP TRIGGER IF EXISTS trg_notify_seller_new_order ON public.order_items;

CREATE TRIGGER trg_notify_seller_new_order
  AFTER INSERT ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION public.notify_seller_new_order();

-- Trigger: notify customer when order status changes
CREATE OR REPLACE FUNCTION public.notify_customer_order_status()
RETURNS trigger AS $$
DECLARE
  v_title   text;
  v_message text;
BEGIN
  IF NEW.status = OLD.status THEN RETURN NEW; END IF;

  CASE NEW.status
    WHEN 'packed' THEN
      v_title   := 'Order Packed';
      v_message := 'Your order #' || NEW.id || ' has been packed and is being prepared for delivery.';
    WHEN 'to_receive' THEN
      v_title   := 'Order On The Way';
      v_message := 'Your order #' || NEW.id || ' is out for delivery!';
    WHEN 'received' THEN
      v_title   := 'Order Delivered';
      v_message := 'Your order #' || NEW.id || ' has been marked as delivered. Enjoy!';
    WHEN 'cancelled' THEN
      v_title   := 'Order Cancelled';
      v_message := 'Your order #' || NEW.id || ' has been cancelled.';
    ELSE
      RETURN NEW;
  END CASE;

  PERFORM public.create_notification(
    NEW.customer_id,
    'ORDER_STATUS',
    v_title,
    v_message,
    '/orders'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_customer_order_status ON public.orders;
CREATE TRIGGER trg_notify_customer_order_status
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.notify_customer_order_status();

-- Trigger: notify customer when their refund/dispute is actioned
CREATE OR REPLACE FUNCTION public.notify_customer_refund_update()
RETURNS trigger AS $$
DECLARE
  v_title   text;
  v_message text;
BEGIN
  IF NEW.status = OLD.status THEN RETURN NEW; END IF;

  CASE NEW.status
    WHEN 'approved' THEN
      v_title   := 'Refund Approved';
      v_message := 'Your refund request for order #' || NEW.order_id || ' has been approved.';
    WHEN 'rejected' THEN
      v_title   := 'Refund Rejected';
      v_message := 'Your refund request for order #' || NEW.order_id || ' was rejected.' ||
                   CASE WHEN NEW.admin_notes IS NOT NULL THEN ' Reason: ' || NEW.admin_notes ELSE '' END;
    WHEN 'processed' THEN
      v_title   := 'Refund Processed';
      v_message := 'Your refund for order #' || NEW.order_id || ' has been processed and is on the way.';
    ELSE
      RETURN NEW;
  END CASE;

  PERFORM public.create_notification(
    NEW.customer_id,
    'REFUND_UPDATE',
    v_title,
    v_message,
    '/orders'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_customer_refund_update ON public.refunds_disputes;
CREATE TRIGGER trg_notify_customer_refund_update
  AFTER UPDATE OF status ON public.refunds_disputes
  FOR EACH ROW EXECUTE FUNCTION public.notify_customer_refund_update();

-- Trigger: notify seller when their payout is actioned
CREATE OR REPLACE FUNCTION public.notify_seller_payout_update()
RETURNS trigger AS $$
DECLARE
  v_title   text;
  v_message text;
BEGIN
  IF NEW.status = OLD.status THEN RETURN NEW; END IF;

  CASE NEW.status
    WHEN 'processing' THEN
      v_title   := 'Payout Processing';
      v_message := 'Your payout of ₱' || NEW.amount::text || ' is being processed.';
    WHEN 'completed' THEN
      v_title   := 'Payout Completed';
      v_message := 'Your payout of ₱' || NEW.amount::text || ' has been sent via ' || COALESCE(NEW.payout_method, 'your chosen method') || '.';
    WHEN 'failed' THEN
      v_title   := 'Payout Failed';
      v_message := 'Your payout of ₱' || NEW.amount::text || ' could not be processed. Please contact support.';
    ELSE
      RETURN NEW;
  END CASE;

  PERFORM public.create_notification(
    NEW.seller_id,
    'PAYOUT_UPDATE',
    v_title,
    v_message,
    '/seller/settings'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_seller_payout_update ON public.seller_payouts;
CREATE TRIGGER trg_notify_seller_payout_update
  AFTER UPDATE OF status ON public.seller_payouts
  FOR EACH ROW EXECUTE FUNCTION public.notify_seller_payout_update();

-- Trigger: notify admin when a new refund/dispute is submitted
CREATE OR REPLACE FUNCTION public.notify_admins_new_dispute()
RETURNS trigger AS $$
DECLARE
  v_admin_id uuid;
BEGIN
  FOR v_admin_id IN
    SELECT id FROM public.profiles WHERE role = 'admin'
  LOOP
    PERFORM public.create_notification(
      v_admin_id,
      'NEW_DISPUTE',
      'New Refund / Dispute',
      'A new ' || NEW.dispute_type || ' request has been submitted for order #' || NEW.order_id,
      '/admin/refunds'
    );
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_admins_new_dispute ON public.refunds_disputes;
CREATE TRIGGER trg_notify_admins_new_dispute
  AFTER INSERT ON public.refunds_disputes
  FOR EACH ROW EXECUTE FUNCTION public.notify_admins_new_dispute();

-- Trigger: notify admin when a new payout is requested
CREATE OR REPLACE FUNCTION public.notify_admins_new_payout()
RETURNS trigger AS $$
DECLARE
  v_admin_id uuid;
BEGIN
  FOR v_admin_id IN
    SELECT id FROM public.profiles WHERE role = 'admin'
  LOOP
    PERFORM public.create_notification(
      v_admin_id,
      'NEW_PAYOUT_REQUEST',
      'New Payout Request',
      'A seller has requested a payout of ₱' || NEW.amount::text || ' via ' || COALESCE(NEW.payout_method, 'unknown method'),
      '/admin/payouts'
    );
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_admins_new_payout ON public.seller_payouts;
CREATE TRIGGER trg_notify_admins_new_payout
  AFTER INSERT ON public.seller_payouts
  FOR EACH ROW EXECUTE FUNCTION public.notify_admins_new_payout();

-- Trigger: notify seller when a refund/dispute is filed against them
CREATE OR REPLACE FUNCTION public.notify_seller_new_dispute()
RETURNS trigger AS $$
BEGIN
  PERFORM public.create_notification(
    NEW.seller_id,
    'DISPUTE_FILED',
    'Dispute Filed Against You',
    'A customer has filed a ' || NEW.dispute_type || ' request for order #' || NEW.order_id || '. Admin is reviewing it.',
    '/seller/orders'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_seller_new_dispute ON public.refunds_disputes;
CREATE TRIGGER trg_notify_seller_new_dispute
  AFTER INSERT ON public.refunds_disputes
  FOR EACH ROW EXECUTE FUNCTION public.notify_seller_new_dispute();
