'use client';

import React, { useEffect, useState } from 'react';
import { useProductLoader } from '@/features/products/hooks/useProductLoader';
import { ProductGrid } from '@/features/products/components/ProductGrid';
import { Input } from '@/components/ui/input';
import { Search, Sparkles } from 'lucide-react';
import { MarketplaceGate } from '@/features/auth/components/MarketplaceGate';
import { usePageVisibility } from '@/components/layout/PageVisibilityProvider';

export default function MarketplaceHome() {
  const { products, isLoading, loadFeed, searchProducts, sortBy, setSortBy, productTypeFilter, setProductTypeFilter } = useProductLoader();
  const [searchQuery, setSearchQuery] = useState('');
  const isVisible = usePageVisibility();
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Only load feed when page is visible
    if (isVisible) {
      loadFeed();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible]); // Only depend on isVisible, not loadFeed

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      searchProducts(query);
    }, 400);
  };

  const handleSortChange = (value: string) => {
    setSortBy(value as any);
    loadFeed(20, value as any);
  };

  const handleProductTypeFilter = (type: string) => {
    setProductTypeFilter(type as any);
    loadFeed(20, sortBy, type as any);
  };

  return (
    <MarketplaceGate>
    <div className="space-y-8">
      <div className="relative rounded-2xl bg-linear-to-r from-emerald-600 to-teal-500 text-white p-8 sm:p-10 overflow-hidden shadow-md shadow-emerald-900/10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))]" />
        
        <div className="relative max-w-2xl space-y-4">
          <span className="inline-flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            100% Cash On Delivery Marketplace
          </span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Everything You Need. One Marketplace.
          </h1>
          <p className="text-sm sm:text-base text-emerald-50 max-w-lg font-medium leading-relaxed">
            Discover deals from trusted sellers — electronics, fashion, home essentials, and more. Order with COD and ₱100 flat shipping.
          </p>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col gap-4 bg-white p-5 border border-gray-100 rounded-2xl shadow-xs">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="w-full sm:max-w-md relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search products, brands, categories..."
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

      {/* Marketplace Catalog Grid */}
      <div className="space-y-4">
        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Recommended for you</h2>
        <ProductGrid products={products} isLoading={isLoading} />
      </div>
    </div>
    </MarketplaceGate>
  );
}
