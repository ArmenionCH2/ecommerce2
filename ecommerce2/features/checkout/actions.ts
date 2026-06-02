'use server';

/**
 * ORDER PLACEMENT SERVER ACTION
 *
 * Execution sequence (must be atomic):
 *   1. Re-fetch authoritative prices via calculateOrderTotal()
 *   2. Insert master order row into public.orders
 *   3. Insert itemized rows into public.order_items
 *      → Triggers tr_deduct_stock automatically (DB trigger)
 *   4. Clear customer's cart_items from the database
 *   5. Return success + orderId to client
 */

import { createServerClient }                           from '@/lib/supabaseServer';
import { calculateOrderTotal }                          from './utils/calculations';
import type { OrderPlacementPayload, OrderPlacementResult } from '@/lib/types';

export async function executeOrderPlacement(
  payload: OrderPlacementPayload
): Promise<OrderPlacementResult> {
  const supabase = createServerClient();

  try {
    // Step 1: Calculate totals using DB prices (never client prices)
    const { lines, grandTotal } = await calculateOrderTotal(payload);

    // Step 2: Write master order record
    const { data: orderRow, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_id     : payload.customerId,
        total_amount    : grandTotal,
        status          : 'placed',
        shipping_address: payload.shippingAddress,
      })
      .select('id')
      .single();

    if (orderError || !orderRow) {
      throw new Error(`Order creation failed: ${orderError?.message}`);
    }

    const orderId = orderRow.id;

    // Step 3: Write itemized order_items (triggers tr_deduct_stock per row)
    const orderItemRows = lines.map(line => ({
      order_id          : orderId,
      product_id        : line.product_id,
      seller_id         : line.seller_id,
      quantity          : line.quantity,
      price_at_purchase : line.price_at_purchase,
      variation_details : line.variation_id ? `Variation ID: ${line.variation_id}` : null,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItemRows);

    if (itemsError) {
      throw new Error(`Order items write failed: ${itemsError.message}`);
    }

    // Step 4: Clear customer's active cart
    const { error: cartError } = await supabase
      .from('cart_items')
      .delete()
      .eq('customer_id', payload.customerId);

    if (cartError) {
      // Non-fatal — order is placed; log and continue
      console.warn('[ACertain] Cart clear failed (non-fatal):', cartError.message);
    }

    return { success: true, orderId };

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[ACertain] executeOrderPlacement error:', message);
    return { success: false, error: message };
  }
}
