import { createServerClient } from '@/lib/supabaseServer';
import { SHIPPING_FEE, PLATFORM_FEE_PERCENTAGE } from '@/lib/constants';
import type { OrderPlacementPayload } from '@/lib/types';
import type { CalculatedLine, CalculationResult } from '@/features/checkout/utils/calculations';

/**
 * SERVER-SIDE ONLY — never import in 'use client' files.
 *
 * Encapsulates all order pricing logic.
 * Re-fetches authoritative product prices from the DB on every calculation.
 * Prices from the client payload are intentionally ignored.
 */
export class OrderCalculator {
  private shippingFee: number;
  private platformFeeRate: number;

  constructor(
    shippingFee: number = SHIPPING_FEE,
    platformFeeRate: number = PLATFORM_FEE_PERCENTAGE
  ) {
    this.shippingFee = shippingFee;
    this.platformFeeRate = platformFeeRate;
  }

  calculateSubtotal(lines: CalculatedLine[]): number {
    return lines.reduce((sum, line) => sum + line.price_at_purchase * line.quantity, 0);
  }

  calculateGrandTotal(subtotal: number): number {
    return subtotal + this.shippingFee;
  }

  calculatePlatformFee(subtotal: number): number {
    return subtotal * this.platformFeeRate;
  }

  calculateSellerPayout(subtotal: number): number {
    return subtotal - this.calculatePlatformFee(subtotal);
  }

  /**
   * Fetches authoritative prices from DB and computes the full order total.
   * @param payload - Client order payload (prices intentionally excluded)
   */
  async calculateOrder(payload: OrderPlacementPayload): Promise<CalculationResult> {
    const supabase = createServerClient();

    const productIds = payload.items.map(item => item.product_id);

    const { data: products, error } = await supabase
      .from('products')
      .select('id, price, title')
      .in('id', productIds)
      .eq('is_active', true);

    if (error || !products) {
      throw new Error(`Price fetch failed: ${error?.message ?? 'No products returned'}`);
    }

    const priceMap = new Map<number, number>(
      products.map(p => [p.id, Number(p.price)])
    );

    let subtotal = 0;

    const lines: CalculatedLine[] = payload.items.map(item => {
      const dbPrice = priceMap.get(item.product_id);

      if (dbPrice === undefined) {
        throw new Error(`Product ${item.product_id} not found or inactive.`);
      }

      subtotal += dbPrice * item.quantity;

      return {
        product_id        : item.product_id,
        seller_id         : item.seller_id,
        variation_id      : item.variation_id,
        quantity          : item.quantity,
        price_at_purchase : dbPrice,
      };
    });

    return {
      lines,
      subtotal,
      shippingFee : this.shippingFee,
      grandTotal  : this.calculateGrandTotal(subtotal),
    };
  }
}
