'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingCart, Eye, AlertCircle, CheckCircle } from 'lucide-react';
import type { Product } from '@/lib/types';
import { formatPrice } from '@/lib/utils';
import { SellerVerification } from '@/lib/SellerVerification';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useCartActions } from '@/features/cart/hooks/useCartActions';
import { useUserSession } from '@/features/auth/hooks/useUserSession';
import { trackProductView } from '@/features/analytics/utils/trackProductView';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { user } = useUserSession();
  const { addItem } = useCartActions(user && user.role === 'customer' ? user.id : null);
  const [isAdding, setIsAdding] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Track product view when card is rendered
  useEffect(() => {
    trackProductView(product.id);
  }, [product.id]);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigating to detail page
    if (!user) {
      // Save redirect URL and open auth modal
      sessionStorage.setItem('redirectAfterAuth', `/products/${product.id}`);
      window.dispatchEvent(new CustomEvent('openAuthModal', { detail: 'signin' }));
      return;
    }
    if (user.role !== 'customer') {
      alert('Only customers can purchase products.');
      return;
    }

    setIsAdding(true);
    try {
      await addItem(product.id, null, 1);
    } catch (err) {
      console.error('Failed to add item to cart', err);
    } finally {
      setIsAdding(false);
    }
  };

  const isOutOfStock = product.stock_quantity <= 0;

  return (
    <Link href={`/products/${product.id}`} className="group block">
      <Card className="overflow-hidden border border-gray-100 bg-white transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg">
        {/* Product Image Area */}
        <div className="relative aspect-square w-full bg-emerald-50/20 overflow-hidden">
          {product.image_url && !imageError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.image_url}
              alt={product.title}
              onError={() => setImageError(true)}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center bg-linear-to-br from-emerald-500/10 to-teal-500/20 p-4 text-center">
              <span className="text-4xl mb-2">📦</span>
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Product</span>
            </div>
          )}

          {/* Stock Overlay Indicator */}
          {isOutOfStock ? (
            <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center">
              <div className="bg-white/95 px-4 py-1.5 rounded-full flex items-center gap-1.5 text-rose-600 font-bold text-xs shadow-md">
                <AlertCircle className="w-3.5 h-3.5" />
                SOLD OUT
              </div>
            </div>
          ) : product.stock_quantity <= 5 ? (
            <div className="absolute top-3 left-3 bg-amber-500/90 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-xs">
              ONLY {product.stock_quantity} LEFT
            </div>
          ) : null}
        </div>

        {/* Info */}
        <CardContent className="p-4 space-y-2">
          <div>
            <h4 className="font-bold text-gray-800 text-base line-clamp-1 group-hover:text-emerald-600 transition-colors">
              {product.title}
            </h4>
            <p className="text-xs text-gray-400 mt-0.5 line-clamp-2 min-h-[2rem]">
              {product.description || 'No description provided.'}
            </p>
            {product.profiles?.full_name && (
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <span className="font-semibold">by</span> {product.profiles.full_name}
                {new SellerVerification(product.profiles as any).isVerified() && (
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                )}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-gray-50">
            <span className="text-lg font-extrabold text-emerald-600">
              {formatPrice(product.price)}
            </span>

            {/* Actions */}
            <div className="flex gap-1.5">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50"
                title="View Details"
              >
                <Eye className="w-4 h-4" />
              </Button>

              <Button
                size="icon"
                disabled={isOutOfStock || isAdding}
                onClick={handleAddToCart}
                className="h-8 w-8"
                title="Add to Cart"
              >
                <ShoppingCart className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
