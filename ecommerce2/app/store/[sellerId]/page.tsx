'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabaseClient } from '@/lib/supabase';
import { ProductGrid } from '@/features/products/components/ProductGrid';
import { Input } from '@/components/ui/input';
import { Search, Award, ArrowLeft, Package } from 'lucide-react';
import type { Product } from '@/lib/types';

type SortOption = 'newest' | 'price_low' | 'price_high' | 'name_asc';
type ProductTypeFilter = 'all' | 'electronics' | 'clothing' | 'home' | 'sports' | 'toys' | 'books' | 'food' | 'other';

interface SellerProfile {
  id: string;
  full_name: string;
  is_verified: boolean;
  seller_tier: string | null;
  created_at: string;
}

export default function SellerStorefront() {
  const { sellerId } = useParams<{ sellerId: string }>();
  const [seller, setSeller] = useState<SellerProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [productTypeFilter, setProductTypeFilter] = useState<ProductTypeFilter>('all');
  const [productCount, setProductCount] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    async function fetchSellerProfile() {
      if (!sellerId) return;

      const { data, error } = await supabaseClient
        .from('profiles')
        .select('id, full_name, is_verified, seller_tier, created_at')
        .eq('id', sellerId)
        .eq('role', 'seller')
        .single();

      if (error || !data) {
        setIsLoading(false);
        return;
      }

      setSeller(data);
      await fetchStoreProducts(sellerId);
    }

    fetchSellerProfile();
  }, [sellerId]);

  const fetchStoreProducts = async (
    sellerId: string,
    searchQuery: string = '',
    sortBy: SortOption = 'newest',
    productType: ProductTypeFilter = 'all'
  ) => {
    let query = supabaseClient
      .from('products')
      .select('*, profiles!inner(full_name)')
      .eq('is_active', true)
      .eq('seller_id', sellerId);

    if (searchQuery) {
      query = query.ilike('title', `%${searchQuery}%`);
    }

    if (productType !== 'all') {
      if (productType === 'other') {
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

    const { data, error } = await query;

    if (error) {
      console.error('[Storefront] Failed to fetch products:', error.message);
      setProducts([]);
      setProductCount(0);
    } else {
      setProducts((data as Product[]) ?? []);
      setProductCount((data as Product[])?.length ?? 0);
    }

    setIsLoading(false);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (sellerId) {
        fetchStoreProducts(sellerId, query, sortBy, productTypeFilter);
      }
    }, 400);
  };

  const handleSortChange = (value: string) => {
    setSortBy(value as SortOption);
    if (sellerId) {
      fetchStoreProducts(sellerId, searchQuery, value as SortOption, productTypeFilter);
    }
  };

  const handleProductTypeFilter = (type: string) => {
    setProductTypeFilter(type as ProductTypeFilter);
    if (sellerId) {
      fetchStoreProducts(sellerId, searchQuery, sortBy, type as ProductTypeFilter);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 max-w-md mx-auto my-10 space-y-4">
        <span className="text-5xl">🏪</span>
        <h3 className="text-xl font-bold text-gray-800">Store not found</h3>
        <p className="text-sm text-gray-500 max-w-xs mx-auto">
          The seller you're looking for doesn't exist or isn't available.
        </p>
        <Link href="/">
          <button className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600 hover:text-emerald-700">
            <ArrowLeft className="w-4 h-4" />
            Back to marketplace
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Back link */}
      <div>
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-emerald-600 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to marketplace
        </Link>
      </div>

      {/* Seller Profile Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                {seller.full_name}
              </h1>
              {seller.is_verified && (
                <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                  <Award className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase">Verified</span>
                </div>
              )}
            </div>
            {seller.seller_tier && (
              <div className="inline-flex items-center gap-1 bg-gray-100 px-2.5 py-1 rounded-full">
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  {seller.seller_tier}
                </span>
              </div>
            )}
            <p className="text-sm text-gray-500">
              Member since {formatDate(seller.created_at)} · {productCount} active listings
            </p>
          </div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col gap-4 bg-white p-5 border border-gray-100 rounded-2xl shadow-xs">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="w-full sm:max-w-md relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search this seller's products..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-10 h-11"
            />
          </div>
          <div className="flex gap-2 items-center">
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
              className="px-3.5 py-2 rounded-xl bg-gray-50 border border-gray-100 text-xs font-bold text-gray-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-200/50 focus:border-emerald-500 cursor-pointer"
            >
              <option value="newest">Newest</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
              <option value="name_asc">Name: A to Z</option>
            </select>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleProductTypeFilter('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border cursor-pointer transition-colors ${
              productTypeFilter === 'all'
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-gray-50 text-gray-700 border-gray-100 hover:bg-gray-100'
            }`}
          >
            All Products
          </button>
          <button
            onClick={() => handleProductTypeFilter('electronics')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border cursor-pointer transition-colors ${
              productTypeFilter === 'electronics'
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-gray-50 text-gray-700 border-gray-100 hover:bg-gray-100'
            }`}
          >
            Electronics
          </button>
          <button
            onClick={() => handleProductTypeFilter('clothing')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border cursor-pointer transition-colors ${
              productTypeFilter === 'clothing'
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-gray-50 text-gray-700 border-gray-100 hover:bg-gray-100'
            }`}
          >
            Clothing
          </button>
          <button
            onClick={() => handleProductTypeFilter('home')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border cursor-pointer transition-colors ${
              productTypeFilter === 'home'
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-gray-50 text-gray-700 border-gray-100 hover:bg-gray-100'
            }`}
          >
            Home & Garden
          </button>
          <button
            onClick={() => handleProductTypeFilter('sports')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border cursor-pointer transition-colors ${
              productTypeFilter === 'sports'
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-gray-50 text-gray-700 border-gray-100 hover:bg-gray-100'
            }`}
          >
            Sports & Outdoors
          </button>
          <button
            onClick={() => handleProductTypeFilter('toys')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border cursor-pointer transition-colors ${
              productTypeFilter === 'toys'
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-gray-50 text-gray-700 border-gray-100 hover:bg-gray-100'
            }`}
          >
            Toys & Games
          </button>
          <button
            onClick={() => handleProductTypeFilter('books')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border cursor-pointer transition-colors ${
              productTypeFilter === 'books'
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-gray-50 text-gray-700 border-gray-100 hover:bg-gray-100'
            }`}
          >
            Books
          </button>
          <button
            onClick={() => handleProductTypeFilter('food')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border cursor-pointer transition-colors ${
              productTypeFilter === 'food'
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-gray-50 text-gray-700 border-gray-100 hover:bg-gray-100'
            }`}
          >
            Food & Beverages
          </button>
          <button
            onClick={() => handleProductTypeFilter('other')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border cursor-pointer transition-colors ${
              productTypeFilter === 'other'
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-gray-50 text-gray-700 border-gray-100 hover:bg-gray-100'
            }`}
          >
            Other
          </button>
        </div>
      </div>

      {/* Product Grid */}
      <div className="space-y-4">
        <h2 className="text-2xl font-black text-gray-900 tracking-tight">
          {seller.full_name}'s Listings
        </h2>
        <ProductGrid products={products} isLoading={isLoading} />
      </div>
    </div>
  );
}
