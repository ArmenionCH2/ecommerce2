'use client';

import React from 'react';
import type { ProductVariation } from '@/lib/types';
import { formatPrice } from '@/lib/utils';

interface VariationSelectorProps {
  variations: ProductVariation[];
  selectedVariation: ProductVariation | null;
  onSelectVariation: (variation: ProductVariation | null) => void;
}

export function VariationSelector({
  variations,
  selectedVariation,
  onSelectVariation,
}: VariationSelectorProps) {
  if (variations.length === 0) return null;

  // Group variations by name (e.g., "Bundle Size", "Quality Grade")
  const grouped = variations.reduce<Record<string, ProductVariation[]>>((acc, v) => {
    acc[v.name] = acc[v.name] || [];
    acc[v.name].push(v);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([name, items]) => (
        <div key={name} className="space-y-2">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Select {name}
          </label>
          <div className="flex flex-wrap gap-2.5">
            {items.map((v) => {
              const isSelected = selectedVariation?.id === v.id;
              const isOutOfStock = v.stock_quantity <= 0;

              return (
                <button
                  key={v.id}
                  type="button"
                  disabled={isOutOfStock}
                  onClick={() => onSelectVariation(isSelected ? null : v)}
                  className={`py-2.5 px-4 rounded-xl border text-sm font-semibold transition-all duration-200 cursor-pointer active:scale-95 transition-transform ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-700 shadow-xs'
                      : isOutOfStock
                      ? 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed line-through'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700 bg-white'
                  }`}
                >
                  <span className="block">{v.value}</span>
                  {v.price_modifier !== 0 && (
                    <span className={`text-[10px] block mt-0.5 ${isSelected ? 'text-emerald-600' : 'text-gray-400'}`}>
                      {v.price_modifier > 0 ? '+' : ''}
                      {formatPrice(Number(v.price_modifier))}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
