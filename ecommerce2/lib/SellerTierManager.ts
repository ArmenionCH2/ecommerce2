import { TIER_LIMITS, TIER_LABELS, SELLER_TIERS } from '@/lib/constants';

/**
 * Manages seller tier rules and limits for a given seller tier level.
 * Wraps TIER_LIMITS constant lookups with typed methods and validation logic.
 */
export class SellerTierManager {
  private tier: number;

  constructor(tier: number | null | undefined) {
    // Default to Tier 1 if null/undefined
    this.tier = tier ?? SELLER_TIERS.TIER_1;
  }

  getMaxListings(): number {
    return TIER_LIMITS[this.tier as keyof typeof TIER_LIMITS]?.MAX_LISTINGS ?? 10;
  }

  getMaxItemPrice(): number {
    return TIER_LIMITS[this.tier as keyof typeof TIER_LIMITS]?.MAX_ITEM_PRICE ?? 5000;
  }

  getPayoutHoldDays(): number {
    return TIER_LIMITS[this.tier as keyof typeof TIER_LIMITS]?.PAYOUT_HOLD_DAYS ?? 7;
  }

  getLabel(): string {
    return TIER_LABELS[this.tier] ?? 'Unknown Tier';
  }

  /**
   * Returns true if the seller is allowed to list a new product
   * given their current listing count and the new product's price.
   */
  canListProduct(currentListingCount: number, productPrice: number): boolean {
    return (
      currentListingCount < this.getMaxListings() &&
      productPrice <= this.getMaxItemPrice()
    );
  }

  canUpgradeTo(targetTier: number): boolean {
    return targetTier === this.tier + 1;
  }

  getTier(): number {
    return this.tier;
  }
}
