/** All shared TypeScript interfaces. Import from here — never redeclare inline. */

export type UserRole    = 'customer' | 'seller' | 'admin' | 'pending_seller';
export type OrderStatus = 'placed' | 'packed' | 'to_receive' | 'received' | 'cancelled';

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
  seller_tier     : number | null;
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
  profiles?     : Pick<Profile, 'full_name'> | null;
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
  product?    : Product;         // Join-expanded (optional)
  variation?  : ProductVariation; // Join-expanded (optional)
}

export interface Order {
  id              : number;
  customer_id     : string;
  total_amount    : number;
  status          : OrderStatus;
  shipping_address: string;
  created_at      : string;
  order_items?    : OrderItem[]; // Join-expanded (optional)
}

export interface OrderItem {
  id                : number;
  order_id          : number;
  product_id        : number;
  seller_id         : string;
  variation_details : string | null;
  quantity          : number;
  price_at_purchase : number;
}

export interface Review {
  id          : number;
  product_id  : number;
  customer_id : string;
  rating      : number;
  comment     : string | null;
  created_at  : string;
  profile?    : Pick<Profile, 'full_name'>; // Join-expanded (optional)
}

export interface SellerAnalytics {
  seller_id              : string;
  total_earnings         : number;
  total_orders_handled   : number;
  pending_orders_count   : number;
  completed_orders_count : number;
}

export interface ProductSalesReport {
  product_id     : number;
  title          : string;
  list_price     : number;
  stock_quantity : number;
  is_active      : boolean;
  units_sold     : number;
  revenue        : number;
  orders_count   : number;
}

export interface VerificationRequest {
  id                  : string;
  seller_id           : string;
  business_name       : string;
  business_description: string | null;
  business_document_url: string | null;
  applied_tier        : number | null;
  request_type        : 'registration' | 'upgrade';
  id_document_url     : string | null;
  selfie_url          : string | null;
  rejection_count     : number;
  status              : 'pending' | 'approved' | 'rejected';
  admin_notes         : string | null;
  created_at          : string;
  updated_at          : string;
}

export interface OrderFee {
  id             : string;
  order_id       : string;
  platform_fee   : number;
  seller_payout  : number;
  fee_percentage : number;
  created_at     : string;
}

export interface SellerBalance {
  seller_id         : string;
  available_balance : number;
  pending_balance   : number;
  total_earnings    : number;
  updated_at        : string;
}

export interface SellerPayout {
  id             : string;
  seller_id      : string;
  amount         : number;
  status         : 'pending' | 'processing' | 'completed' | 'failed';
  payout_method  : string | null;
  payout_details : Record<string, unknown> | null;
  requested_at   : string;
  processed_at   : string | null;
  created_at     : string;
}

export interface AdminAuditLog {
  id          : string;
  admin_id    : string;
  action_type : string;
  target_type : string;
  target_id   : string | null;
  old_values  : Record<string, unknown> | null;
  new_values  : Record<string, unknown> | null;
  reason      : string | null;
  ip_address  : string | null;
  user_agent  : string | null;
  created_at  : string;
}

export interface RefundDispute {
  id            : string;
  order_id      : string;
  customer_id   : string;
  seller_id     : string;
  refund_amount : number;
  reason        : string;
  status        : 'pending' | 'approved' | 'rejected' | 'processed';
  dispute_type  : 'refund' | 'dispute' | 'return';
  admin_notes   : string | null;
  processed_by  : string | null;
  processed_at  : string | null;
  created_at    : string;
  updated_at    : string;
}

/** Payload shape for order placement. Prices are NEVER trusted from this object. */
export interface OrderPlacementPayload {
  customerId      : string;
  shippingAddress : string;
  items           : Array<{
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

export interface Notification {
  id         : string;
  user_id    : string;
  type       : string;
  title      : string;
  message    : string;
  link       : string | null;
  is_read    : boolean;
  created_at : string;
}
