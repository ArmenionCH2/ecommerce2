/**
 * PHASE 2 STUB — TEXT SIMILARITY SEARCH
 *
 * Status: PLACEHOLDER — always returns empty array.
 *
 * Phase 2 Implementation Plan:
 *   1. Use pg_trgm index (already created: idx_products_title_trgm)
 *   2. Query: SELECT * FROM products WHERE title % $query ORDER BY similarity(title, $query) DESC
 *   3. Use Supabase .rpc('search_products_by_similarity', { query_text: searchTerm })
 *   4. Create a Postgres function wrapping the trigram query
 *
 * The GIN index is already in place. This file just needs to be implemented.
 */

import type { Product } from '@/lib/types';

/** @todo Phase 2: Implement pg_trgm trigram similarity search */
export async function textSimilarity(
  searchTerm: string,
  limit = 10
): Promise<Product[]> {
  // Stub: returns empty until Phase 2 is implemented
  console.info('[ACertain] textSimilarity: Phase 2 not yet active.', searchTerm, limit);
  return [];
}
