/** Platform-wide immutable constants. Never hardcode these inline. */

export const SHIPPING_FEE = 100.00 as const; // ₱100.00 flat, COD mandate

export const USER_ROLES = {
  CUSTOMER : 'customer',
  SELLER   : 'seller',
  ADMIN    : 'admin',
} as const;

export const ORDER_STATUSES = {
  PLACED     : 'placed',
  PACKED     : 'packed',
  TO_RECEIVE : 'to_receive',
  RECEIVED   : 'received',
  CANCELLED  : 'cancelled',
} as const;

export const ORDER_STATUS_LABELS: Record<string, string> = {
  placed     : 'Order Placed',
  packed     : 'On The Way',
  to_receive : 'On The Way',
  received   : 'Delivered',
  cancelled  : 'Cancelled',
};

export const SELLER_TIERS = {
  TIER_1: 1, // Individual/Reseller
  TIER_2: 2, // Small Business
  TIER_3: 3, // Large Business/Mall
} as const;

export const TIER_LIMITS = {
  [SELLER_TIERS.TIER_1]: {
    MAX_LISTINGS: 10,
    MAX_ITEM_PRICE: 5000,
    PAYOUT_HOLD_DAYS: 7,
  },
  [SELLER_TIERS.TIER_2]: {
    MAX_LISTINGS: 50,
    MAX_ITEM_PRICE: 50000,
    PAYOUT_HOLD_DAYS: 3,
  },
  [SELLER_TIERS.TIER_3]: {
    MAX_LISTINGS: Infinity,
    MAX_ITEM_PRICE: Infinity,
    PAYOUT_HOLD_DAYS: 0,
  },
} as const;

export const TIER_LABELS: Record<number, string> = {
  1: 'Individual/Reseller',
  2: 'Small Business',
  3: 'Large Business/Mall',
};
