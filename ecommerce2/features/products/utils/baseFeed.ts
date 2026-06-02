/**
 * PHASE 1 — BASE FEED ALGORITHM
 *
 * Sorts products by creation timestamp descending.
 * This is the default feed. Phase 2 swaps this for trendingAlgo.ts
 * without any changes to components or route files.
 *
 * Swap guide: In useProductLoader.ts, replace `baseFeed` import
 * with `trendingAlgo` import. Zero other changes required.
 */

import { supabaseClient } from '@/lib/supabase';
import type { Product }   from '@/lib/types';

export type SortOption = 'newest' | 'price_low' | 'price_high' | 'name_asc';
export type ProductTypeFilter = 'all' | 'electronics' | 'clothing' | 'home' | 'sports' | 'toys' | 'books' | 'food' | 'other';

/**
 * Fetches active products sorted by the specified option.
 * @param limit - Max number of products to return (default 20)
 * @param sortBy - Sort option (default: newest)
 * @param productType - Product type filter (default: all)
 * @returns Array of active products
 */
export async function baseFeed(limit = 20, sortBy: SortOption = 'newest', productType: ProductTypeFilter = 'all'): Promise<Product[]> {
  let query = supabaseClient
    .from('products')
    .select('*, profiles!inner(full_name)')
    .eq('is_active', true);

  if (productType !== 'all') {
    if (productType === 'other') {
      // For "other", include products with null product_type (old products)
      query = query.is('product_type', null);
    } else {
      query = query.eq('product_type', productType);
    }
  }

  switch (sortBy) {
    case 'newest':
      query = query.order('created_at', { ascending: false });
      break;
    case 'price_low':
      query = query.order('price', { ascending: true });
      break;
    case 'price_high':
      query = query.order('price', { ascending: false });
      break;
    case 'name_asc':
      query = query.order('title', { ascending: true });
      break;
  }

  const { data, error } = await query.limit(limit);

  if (error) {
    console.error('[ACertain] baseFeed error:', error.message);
    return [];
  }

  return (data as Product[]) ?? [];
}
