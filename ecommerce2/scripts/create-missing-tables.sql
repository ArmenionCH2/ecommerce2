-- ============================================================================
-- CREATE MISSING DATABASE TABLES
-- ============================================================================
-- This script creates tables that are defined in TypeScript types but missing from the database
-- ============================================================================

-- Create seller_balances table
CREATE TABLE IF NOT EXISTS seller_balances (
  seller_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  available_balance NUMERIC NOT NULL DEFAULT 0,
  pending_balance NUMERIC NOT NULL DEFAULT 0,
  total_earnings NUMERIC NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create seller_payouts table
CREATE TABLE IF NOT EXISTS seller_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  payout_method TEXT,
  payout_details JSONB,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create order_fees table
CREATE TABLE IF NOT EXISTS order_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT NOT NULL,
  platform_fee NUMERIC NOT NULL,
  seller_payout NUMERIC NOT NULL,
  fee_percentage NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create verification_requests table
CREATE TABLE IF NOT EXISTS verification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  business_description TEXT,
  business_document_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create admin_audit_log table
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  old_values JSONB,
  new_values JSONB,
  reason TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Note: refunds_disputes already exists as a view, skipping table creation
-- If you need it as a table, drop the view first: DROP VIEW IF EXISTS refunds_disputes;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_seller_payouts_seller_id ON seller_payouts(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_payouts_status ON seller_payouts(status);
CREATE INDEX IF NOT EXISTS idx_verification_requests_seller_id ON verification_requests(seller_id);
CREATE INDEX IF NOT EXISTS idx_verification_requests_status ON verification_requests(status);
-- Skip indexes on refunds_disputes (it's a view, not a table)
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_id ON admin_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON admin_audit_log(created_at);

-- Create seller_analytics view
CREATE OR REPLACE VIEW seller_analytics AS
SELECT 
  p.seller_id,
  COALESCE(SUM(oi.price_at_purchase * oi.quantity), 0) AS total_earnings,
  COALESCE(COUNT(DISTINCT oi.order_id), 0) AS total_orders_handled,
  COALESCE(COUNT(DISTINCT CASE WHEN o.status = 'placed' THEN oi.order_id END), 0) AS pending_orders_count,
  COALESCE(COUNT(DISTINCT CASE WHEN o.status IN ('received', 'to_receive') THEN oi.order_id END), 0) AS completed_orders_count
FROM seller_balances p
LEFT JOIN order_items oi ON oi.seller_id = p.seller_id
LEFT JOIN orders o ON o.id = oi.order_id
GROUP BY p.seller_id;

-- Create product_sales_report view
CREATE OR REPLACE VIEW product_sales_report AS
SELECT 
  pr.id AS product_id,
  pr.title,
  pr.price AS list_price,
  pr.stock_quantity,
  pr.is_active,
  COALESCE(SUM(oi.quantity), 0) AS units_sold,
  COALESCE(SUM(oi.price_at_purchase * oi.quantity), 0) AS revenue,
  COALESCE(COUNT(DISTINCT oi.order_id), 0) AS orders_count
FROM products pr
LEFT JOIN order_items oi ON oi.product_id = pr.id
GROUP BY pr.id, pr.title, pr.price, pr.stock_quantity, pr.is_active;
