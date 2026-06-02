/**
 * PHASE 2 STUB — TRENDING ALGORITHM
 *
 * Status: PLACEHOLDER — returns baseFeed output until Phase 2 is activated.
 *
 * Phase 2 Implementation Plan:
 *   1. Query public.reviews aggregated by product_id → AVG(rating), COUNT(*)
 *   2. Score each product: (avg_rating * 0.6) + (review_count * 0.4)
 *   3. Sort by composite score DESC
 *   4. Replace stub body with scored query
 *
 * No component changes needed — swap is isolated to this file + useProductLoader.ts.
 */

import { baseFeed }     from './baseFeed';
import type { Product } from '@/lib/types';

/** @todo Phase 2: Implement review-aggregation feed scoring */
export async function trendingAlgo(limit = 20): Promise<Product[]> {
  // Stub: falls back to baseFeed until Phase 2 is implemented
  console.info('[ACertain] trendingAlgo: Phase 2 not yet active. Using baseFeed.');
  return baseFeed(limit);
}
