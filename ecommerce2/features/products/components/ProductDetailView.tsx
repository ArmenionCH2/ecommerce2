'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, ArrowLeft, ShieldCheck, Truck, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import type { Product, ProductVariation } from '@/lib/types';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { VariationSelector } from './VariationSelector';
import { useCartActions } from '@/features/cart/hooks/useCartActions';
import { useUserSession } from '@/features/auth/hooks/useUserSession';
import { ReviewSection } from '@/features/reviews/components/ReviewSection';

interface ProductDetailViewProps {
  product: Product;
  variations: ProductVariation[];
}

export function ProductDetailView({ product, variations }: ProductDetailViewProps) {
  const { user } = useUserSession();
  const { addItem } = useCartActions(user && user.role === 'customer' ? user.id : null);

  const router = useRouter();
  const [selectedVariation, setSelectedVariation] = useState<ProductVariation | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [isBuyingNow, setIsBuyingNow] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [successMessage, setSuccessMessage] = useState(false);

  // Reset quantity if selected variation changes
  useEffect(() => {
    Promise.resolve().then(() => {
      setQuantity(1);
    });
  }, [selectedVariation]);

  const basePrice = Number(product.price);
  const modifier = selectedVariation ? Number(selectedVariation.price_modifier) : 0;
  const currentPrice = basePrice + modifier;

  const maxStock = selectedVariation ? selectedVariation.stock_quantity : product.stock_quantity;
  const isOutOfStock = maxStock <= 0;

  const handleIncrement = () => {
    if (quantity < maxStock) setQuantity((prev) => prev + 1);
  };

  const handleDecrement = () => {
    if (quantity > 1) setQuantity((prev) => prev - 1);
  };

  const handleAddToCart = async () => {
    if (!user) {
      // Save redirect URL and open auth modal
      sessionStorage.setItem('redirectAfterAuth', window.location.pathname);
      window.dispatchEvent(new CustomEvent('openAuthModal', { detail: 'signin' }));
      return;
    }
    if (user.role !== 'customer') {
      alert('Only customers can purchase products.');
      return;
    }

    setIsAdding(true);
    setSuccessMessage(false);
    try {
      await addItem(product.id, selectedVariation ? selectedVariation.id : null, quantity);
      setSuccessMessage(true);
      setTimeout(() => setSuccessMessage(false), 3000);
    } catch (err) {
      console.error('Failed to add item to cart', err);
    } finally {
      setIsAdding(false);
    }
  };

  const handleBuyNow = async () => {
    if (!user) {
      // Save redirect URL and open auth modal
      sessionStorage.setItem('redirectAfterAuth', window.location.pathname);
      window.dispatchEvent(new CustomEvent('openAuthModal', { detail: 'signin' }));
      return;
    }
    if (user.role !== 'customer') {
      alert('Only customers can purchase products.');
      return;
    }

    setIsBuyingNow(true);
    try {
      await addItem(product.id, selectedVariation ? selectedVariation.id : null, quantity);
      router.push('/checkout');
    } catch (err) {
      console.error('Failed to add item to cart', err);
    } finally {
      setIsBuyingNow(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-300">
      {/* Back navigation */}
      <div>
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-emerald-600 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to marketplace
        </Link>
      </div>

      {/* Main product card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-xs">
        {/* Product Image */}
        <div className="relative aspect-square w-full bg-emerald-50/10 rounded-2xl overflow-hidden border border-gray-50">
          {product.image_url && !imageError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.image_url}
              alt={product.title}
              onError={() => setImageError(true)}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center bg-linear-to-br from-emerald-500/10 to-teal-500/20 p-8 text-center">
              <span className="text-6xl mb-4">📦</span>
              <span className="text-base font-bold text-emerald-800 uppercase tracking-wider">Product listing</span>
            </div>
          )}
        </div>

        {/* Product details */}
        <div className="flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div>
              <span className="inline-block text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-wider mb-2">
                Verified seller
              </span>
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">{product.title}</h1>
              {product.profiles?.full_name && (
                <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                  <span className="font-semibold">Sold by</span>{' '}
                  <Link
                    href={`/store/${product.seller_id}`}
                    className="text-emerald-600 hover:underline font-semibold"
                  >
                    {product.profiles.full_name}
                  </Link>
                </p>
              )}
            </div>

            <div className="text-2xl font-black text-emerald-600">
              {formatPrice(currentPrice)}
            </div>

            <p className="text-sm text-gray-500 leading-relaxed">
              {product.description || 'No description provided for this listing. Contact the seller if you need more details before ordering.'}
            </p>

            {/* Variations */}
            {variations.length > 0 && (
              <VariationSelector
                variations={variations}
                selectedVariation={selectedVariation}
                onSelectVariation={setSelectedVariation}
              />
            )}

            {/* Stock indicator */}
            <div className="flex items-center gap-2 text-sm text-gray-500 pt-2">
              <span className="font-semibold">Availability:</span>
              {isOutOfStock ? (
                <span className="text-rose-600 font-bold">Sold Out</span>
              ) : (
                <span className="text-emerald-600 font-semibold">{maxStock} units in stock</span>
              )}
            </div>
          </div>

          {/* Add to Cart Actions */}
          <div className="space-y-4 pt-4 border-t border-gray-50">
            {!isOutOfStock && (
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-gray-500">Qty:</span>
                <div className="flex items-center border border-gray-200 rounded-xl bg-gray-50 overflow-hidden">
                  <button
                    type="button"
                    onClick={handleDecrement}
                    className="w-10 h-10 flex items-center justify-center font-bold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer active:scale-95 active:opacity-80"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={maxStock}
                    value={quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (!isNaN(val)) {
                        const clamped = Math.max(1, Math.min(val, maxStock));
                        setQuantity(clamped);
                      }
                    }}
                    onBlur={() => {
                      if (quantity < 1 || isNaN(quantity)) setQuantity(1);
                    }}
                    className="w-12 text-center text-sm font-bold text-gray-800 bg-transparent border-0 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleIncrement}
                    className="w-10 h-10 flex items-center justify-center font-bold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer active:scale-95 active:opacity-80"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {successMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold rounded-xl">
                Successfully added to cart!
              </div>
            )}

            <Button
              className="w-full h-12 gap-2 active:scale-95 active:opacity-80"
              disabled={isOutOfStock || isAdding}
              onClick={handleAddToCart}
            >
              <ShoppingCart className="w-5 h-5" />
              {isOutOfStock ? 'Sold Out' : isAdding ? 'Adding...' : 'Add to Cart'}
            </Button>

            <Button
              variant="outline"
              className="w-full h-12 gap-2 active:scale-95 active:opacity-80"
              disabled={isOutOfStock || isBuyingNow}
              onClick={handleBuyNow}
            >
              {isOutOfStock ? 'Sold Out' : isBuyingNow ? 'Processing...' : 'Buy Now'}
            </Button>

            {/* Badges / Guarantees */}
            <div className="grid grid-cols-3 gap-2.5 text-center text-[10px] text-gray-400 font-semibold pt-4">
              <div className="flex flex-col items-center gap-1.5 p-2 bg-gray-50/50 rounded-xl">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>COD Only</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 p-2 bg-gray-50/50 rounded-xl">
                <Truck className="w-4 h-4 text-emerald-600" />
                <span>₱100 Shipping</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 p-2 bg-gray-50/50 rounded-xl">
                <RotateCcw className="w-4 h-4 text-emerald-600" />
                <span>Refund Policy</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews section */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-xs">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Customer Reviews</h2>
        <ReviewSection productId={product.id} />
      </div>
    </div>
  );
}
