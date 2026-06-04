'use client';

import React from 'react';
import type { CartItem } from '@/lib/types';
import { formatPrice } from '@/lib/utils';
import { SHIPPING_FEE } from '@/lib/constants';
import { Button } from '@/components/ui/button';

interface CheckoutSummaryCardProps {
  items: CartItem[];
  isLoading: boolean;
  onPlaceOrder?: () => void;
  disabled?: boolean;
}

export function CheckoutSummaryCard({
  items,
  isLoading,
  onPlaceOrder,
  disabled = false,
}: CheckoutSummaryCardProps) {
  const subtotal = items.reduce((sum, item) => {
    if (!item.product) return sum;
    const basePrice = Number(item.product.price);
    const modifier = item.variation ? Number(item.variation.price_modifier) : 0;
    return sum + (basePrice + modifier) * item.quantity;
  }, 0);

  const grandTotal = subtotal + SHIPPING_FEE;

  return (
    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-xs space-y-6 flex flex-col justify-between">
      <div>
        <h3 className="text-lg font-bold text-gray-900">Order Summary</h3>
        <p className="text-xs text-gray-400 mt-1">Universal Flat Rate Cash on Delivery</p>
      </div>

      {/* Items list */}
      <div className="divide-y divide-gray-100 max-h-[240px] overflow-y-auto pr-1">
        {items.map((item) => {
          if (!item.product) return null;
          const price = Number(item.product.price) + (item.variation ? Number(item.variation.price_modifier) : 0);

          return (
            <div key={item.id} className="flex items-center gap-3 py-3.5 text-sm animate-in fade-in-50 duration-200">
              {/* Product thumbnail */}
              <div className="w-12 h-12 flex-shrink-0 rounded-xl overflow-hidden border border-gray-100 bg-emerald-50/30 flex items-center justify-center">
                {item.product.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.product.image_url}
                    alt={item.product.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xl">📦</span>
                )}
              </div>

              {/* Product info */}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-800 truncate">{item.product.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {item.quantity} x {formatPrice(price)}
                  {item.variation && ` (${item.variation.value})`}
                </p>
              </div>

              {/* Line total */}
              <span className="font-extrabold text-gray-800 flex-shrink-0">
                {formatPrice(price * item.quantity)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Pricing breakdowns */}
      <div className="space-y-2 pt-4 border-t border-gray-100">
        <div className="flex justify-between text-sm text-gray-500 font-semibold">
          <span>Subtotal</span>
          <span className="text-gray-900 font-bold">{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-500 font-semibold">
          <span>Shipping Fee (Flat Rate)</span>
          <span className="text-gray-900 font-bold">{formatPrice(SHIPPING_FEE)}</span>
        </div>
        <div className="flex justify-between text-base font-extrabold text-gray-900 pt-3 border-t border-dashed border-gray-200">
          <span>Grand Total (COD)</span>
          <span className="text-emerald-600 text-lg">{formatPrice(grandTotal)}</span>
        </div>
      </div>

      {/* Place order button */}
      {onPlaceOrder && (
        <div className="pt-2">
          <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-[10px] text-emerald-800 font-bold text-center uppercase tracking-wider mb-4">
            💸 Pay via Cash on Delivery at your door
          </div>
          <Button
            onClick={onPlaceOrder}
            disabled={disabled || isLoading || items.length === 0}
            className="w-full h-12 text-base font-bold shadow-md shadow-emerald-100 hover:shadow-lg bg-emerald-600 hover:bg-emerald-500"
          >
            {isLoading ? 'Placing COD Order...' : 'Place Order (COD)'}
          </Button>
        </div>
      )}
    </div>
  );
}
