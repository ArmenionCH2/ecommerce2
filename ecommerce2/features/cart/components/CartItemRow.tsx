'use client';

import React from 'react';
import { Trash2 } from 'lucide-react';
import type { CartItem } from '@/lib/types';
import { formatPrice } from '@/lib/utils';
import { QuantityInput } from './QuantityInput';

interface CartItemRowProps {
  item: CartItem;
  onUpdateQty: (newQty: number) => Promise<void>;
  onRemove: () => Promise<void>;
  isSelected: boolean;
  onToggle: () => void;
}

export function CartItemRow({ item, onUpdateQty, onRemove, isSelected, onToggle }: CartItemRowProps) {
  const { product, variation } = item;

  if (!product) return null;

  const basePrice = Number(product.price);
  const modifier = variation ? Number(variation.price_modifier) : 0;
  const currentPrice = basePrice + modifier;
  const subtotal = currentPrice * item.quantity;

  const maxStock = variation ? variation.stock_quantity : product.stock_quantity;

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 py-4 border-b border-gray-100 last:border-0 animate-in fade-in-50 duration-200">
      {/* Selection Checkbox */}
      <input
        type="checkbox"
        checked={isSelected}
        onChange={onToggle}
        className="mt-1 w-4 h-4 accent-emerald-600 cursor-pointer flex-shrink-0"
      />

      {/* Thumbnail */}
      <div className="w-14 h-14 sm:w-16 sm:h-16 bg-emerald-50/20 rounded-xl overflow-hidden flex-shrink-0 border border-gray-50 flex items-center justify-center">
        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image_url}
            alt={product.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-2xl">📦</span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 w-full">
        <h5 className="font-bold text-gray-800 text-sm truncate">{product.title}</h5>
        {variation && (
          <span className="inline-block text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md mt-1">
            {variation.name}: {variation.value}
          </span>
        )}
        <div className="text-xs text-gray-500 mt-1">
          {formatPrice(currentPrice)} each
        </div>
      </div>

      {/* Actions & Price */}
      <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2 sm:gap-2.5">
        <span className="font-extrabold text-gray-900 text-sm">
          {formatPrice(subtotal)}
        </span>
        <div className="flex items-center gap-2">
          <QuantityInput
            quantity={item.quantity}
            onIncrement={() => onUpdateQty(item.quantity + 1)}
            onDecrement={() => onUpdateQty(item.quantity - 1)}
            disabled={item.quantity >= maxStock}
          />
          <button
            onClick={onRemove}
            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            title="Remove item"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
