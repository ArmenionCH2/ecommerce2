/** All shared TypeScript interfaces. Import from here — never redeclare inline. */

export type UserRole    = 'customer' | 'seller' | 'admin';
export type OrderStatus = 'placed' | 'packed' | 'to_receive' | 'received' | 'cancelled';

// ─── Core entities ────────────────────────────────────────────────────────────

export interface Profile {
  id              : string;
  full_name       : string;
  role            : UserRole;
  phone_number    : string | null;
  delivery_address: string | null;
  is_verified     : boolean;
  is_banned       : boolean;
  ban_reason      : string | null;
  banned_at       : string | null;
  metadata        : Record<string, unknown>;
  created_at      : string;
}

export interface Product {
  id            : number;
  seller_id     : string;
  title         : string;
  description   : string | null;
  price         : number;
  stock_quantity: number;
  image_url     : string | null;
  is_active     : boolean;
  product_type  : string | null;
  created_at    : string;
  profiles?     : Pick<Profile, 'full_name'> | null; // join: products + profiles!inner(full_name)
}

export interface ProductVariation {
  id            : number;
  product_id    : number;
  name          : string;
  value         : string;
  price_modifier: number;
  stock_quantity: number;
}

export interface CartItem {
  id          : number;
  customer_id : string;
  product_id  : number;
  variation_id: number | null;
  quantity    : number;
  created_at  : string;
  product?    : Product;          // join-expanded
  variation?  : ProductVariation; // join-expanded
}

export interface Order {
  id              : number;
  customer_id     : string;
  total_amount    : number;
  status          : OrderStatus;
  shipping_address: string;
  created_at      : string;
  order_items?    : OrderItem[]; // join-expanded
}

export interface OrderItem {
  id               : number;
  order_id         : number;
  product_id       : number;
  seller_id        : string;
  variation_details: string | null;
  quantity         : number;
  price_at_purchase: number;
  // join-expanded selectively by analytics hooks
  orders?: Pick<Order, 'created_at' | 'status'> | null;
}

export interface Review {
  id         : number;
  product_id : number;
  customer_id: string;
  rating     : number;
  comment    : string | null;
  created_at : string;
  profile?   : Pick<Profile, 'full_name'>; // join-expanded
}

// ─── Admin / financial ────────────────────────────────────────────────────────

export interface VerificationRequest {
  id                   : string;
  seller_id            : string;
  business_name        : string;
  business_description : string | null;
  business_document_url: string | null;
  status               : 'pending' | 'approved' | 'rejected';
  admin_notes          : string | null;
  created_at           : string;
  updated_at           : string;
  seller?              : Profile; // join-expanded in verifications page
}

export interface OrderFee {
  id            : string;
  order_id      : number;  // FIX: was `string` — DB column is bigint (number)
  platform_fee  : number;
  seller_payout : number;
  fee_percentage: number;
  created_at    : string;
}

export interface SellerPayout {
  id            : string;
  seller_id     : string;
  amount        : number;
  status        : 'pending' | 'processing' | 'completed' | 'failed';
  payout_method : string | null;
  payout_details: Record<string, unknown> | null;
  requested_at  : string;
  processed_at  : string | null;
  created_at    : string;
  seller?       : Profile; // join-expanded in admin payouts page
}

export interface AdminAuditLog {
  id         : string;
  admin_id   : string;
  action_type: string;
  target_type: string;
  target_id  : string | null;
  old_values : Record<string, unknown> | null;
  new_values : Record<string, unknown> | null;
  reason     : string | null;
  ip_address : string | null;
  user_agent : string | null;
  created_at : string;
  admin?     : Profile; // join-expanded in audit-log page
}

export interface RefundDispute {
  id           : string;
  order_id     : number;  // FIX: was `string` — DB column is bigint (number)
  customer_id  : string;
  seller_id    : string;
  refund_amount: number;
  reason       : string;
  status       : 'pending' | 'approved' | 'rejected' | 'processed';
  dispute_type : 'refund' | 'dispute' | 'return';
  admin_notes  : string | null;
  processed_by : string | null;
  processed_at : string | null;
  created_at   : string;
  updated_at   : string;
  // join-expanded in admin refunds page:
  customer?    : Profile;
  seller?      : Profile;
  order?       : Order;
}

// ─── Analytics / views ────────────────────────────────────────────────────────

export interface SellerAnalytics {
  seller_id             : string;
  total_earnings        : number;
  total_orders_handled  : number;
  pending_orders_count  : number;
  completed_orders_count: number;
}

export interface SellerPerformance {
  seller_id                    : string;
  total_orders                 : number;
  total_revenue                : number;
  average_fulfillment_time_hours: number | null;
  return_rate                  : number;
  average_rating               : number;
  total_reviews                : number;
  seller?                      : Profile; // join-expanded in leaderboard page
}

export interface ProductSalesReport {
  product_id    : number;
  title         : string;
  list_price    : number;
  stock_quantity: number;
  is_active     : boolean;
  units_sold    : number;
  revenue       : number;
  orders_count  : number;
}

export interface ProductMetrics {
  product_id         : number;
  total_views        : number;
  total_adds_to_cart : number;
  total_purchases    : number;
  conversion_rate    : number;
  cart_abandonment_rate: number;
  last_viewed_at     : string | null;
  updated_at         : string;
}

export interface CustomerLTV {
  customer_id             : string;
  total_orders            : number;
  total_spent             : number;
  average_order_value     : number;
  first_purchase_date     : string | null;
  last_purchase_date      : string | null;
  days_since_last_purchase: number | null;
  is_vip                  : boolean;
  customer?               : Profile; // join-expanded in admin insights page
}

export interface SearchTrend {
  id             : string;
  search_query   : string;
  search_count   : number;
  category       : string | null;
  last_searched_at: string;
}

// ─── Action payloads ──────────────────────────────────────────────────────────

/** Payload shape for order placement. Prices are NEVER trusted from this object. */
export interface OrderPlacementPayload {
  customerId     : string;
  shippingAddress: string;
  items          : Array<{
    product_id  : number;
    seller_id   : string;
    quantity    : number;
    variation_id: number | null;
  }>;
}

/** Result returned from executeOrderPlacement */
export interface OrderPlacementResult {
  success : boolean;
  orderId?: number;
  error?  : string;
}