'use client';

import { useState, useCallback } from 'react';
import { supabaseClient } from '@/lib/supabase';
import { baseFeed, type SortOption, type ProductTypeFilter } from '../utils/baseFeed';
import { textSimilarity } from '../utils/textSimilarity';
import type { Product, ProductVariation } from '@/lib/types';
import { usePageVisibility } from '@/components/layout/PageVisibilityProvider';

async function trackSearchQuery(queryText: string) {
  try {
    await supabaseClient.rpc('upsert_search_trend', { query_text: queryText.trim() });
  } catch {
    // non-critical
  }
}

export function useProductLoader() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [productTypeFilter, setProductTypeFilter] = useState<ProductTypeFilter>('all');
  const isVisible = usePageVisibility();

  const loadFeed = useCallback(async (limit = 20, sortOption?: SortOption, productType?: ProductTypeFilter) => {
    // Don't load if tab is hidden
    if (!isVisible) return;

    setIsLoading(true);
    setError(null);
    try {
      const feed = await baseFeed(limit, sortOption || sortBy, productType || productTypeFilter);
      setProducts(feed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load product feed.');
    } finally {
      setIsLoading(false);
    }
  }, [isVisible, sortBy, productTypeFilter]);

  const searchProducts = useCallback(async (queryText: string) => {
    // Don't search if tab is hidden
    if (!isVisible) return;

    if (!queryText.trim()) {
      await loadFeed();
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      // Try to use textSimilarity (Phase 2 stub)
      const similarityResults = await textSimilarity(queryText);
      if (similarityResults && similarityResults.length > 0) {
        setProducts(similarityResults);
        return;
      }

      // Fallback: simple case-insensitive substring match
      const { data, error: fetchErr } = await supabaseClient
        .from('products')
        .select('*, profiles!inner(full_name)')
        .eq('is_active', true)
        .ilike('title', `%${queryText}%`);

      if (fetchErr) throw fetchErr;
      setProducts((data as Product[]) ?? []);
      
      // Track search query (fire and forget)
      if (queryText.trim().length >= 2) trackSearchQuery(queryText);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed.');
    } finally {
      setIsLoading(false);
    }
  }, [loadFeed, isVisible]);

  const loadProductWithVariations = useCallback(async (id: number) => {
    // Don't load if tab is hidden
    if (!isVisible) return null;

    setIsLoading(true);
    setError(null);
    try {
      const { data: product, error: prodErr } = await supabaseClient
        .from('products')
        .select('*, profiles!inner(full_name)')
        .eq('id', id)
        .single();

      if (prodErr) throw prodErr;

      const { data: variations, error: varErr } = await supabaseClient
        .from('product_variations')
        .select('*')
        .eq('product_id', id);

      if (varErr) throw varErr;

      return {
        product: product as Product,
        variations: (variations as ProductVariation[]) ?? [],
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load product detail.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isVisible]);

  return {
    products,
    isLoading,
    error,
    loadFeed,
    searchProducts,
    loadProductWithVariations,
    sortBy,
    setSortBy,
    productTypeFilter,
    setProductTypeFilter,
  };
}
