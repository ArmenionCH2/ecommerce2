'use client';

import React from 'react';
import Link from 'next/link';
import { ShoppingBag, X } from 'lucide-react';
import { Dialog, DialogContent, DialogPortal, DialogOverlay } from '@/components/ui/dialog';
import { useUserSession } from '@/features/auth/hooks/useUserSession';
import { useCartActions } from '../hooks/useCartActions';
import { CartItemRow } from './CartItemRow';
import { formatPrice } from '@/lib/utils';
import { SHIPPING_FEE } from '@/lib/constants';
import { Button } from '@/components/ui/button';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { user } = useUserSession();
  const customerId = user && user.role === 'customer' ? user.id : null;
  const { cartItems, isLoading, updateQty, removeItem } = useCartActions(customerId);
  const [selectedIds, setSelectedIds] = React.useState<Set<number>>(new Set());

  React.useEffect(() => {
    setSelectedIds(prev => {
      const updated = new Set(prev);
      cartItems.forEach(item => updated.add(item.id));
      return updated;
    });
  }, [cartItems]);

  // Subtotal calculation
  const subtotal = cartItems
    .filter(item => selectedIds.has(item.id))
    .reduce((sum, item) => {
      if (!item.product) return sum;
      const basePrice = Number(item.product.price);
      const modifier = item.variation ? Number(item.variation.price_modifier) : 0;
      return sum + (basePrice + modifier) * item.quantity;
    }, 0);

  const grandTotal = subtotal > 0 ? subtotal + SHIPPING_FEE : 0;

  const toggleItem = (id: number) => {
    setSelectedIds(prev => {
      const updated = new Set(prev);
      if (updated.has(id)) {
        updated.delete(id);
      } else {
        updated.add(id);
      }
      return updated;
    });
  };

  const selectedCount = cartItems.filter(i => selectedIds.has(i.id)).length;
  const checkoutHref = `/checkout?items=${[...selectedIds].join(',')}`;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogPortal>
        <DialogOverlay />
        <DialogContent showClose={false} className="fixed right-0 top-0 bottom-0 left-auto z-50 h-full w-full max-w-md translate-x-0 translate-y-0 rounded-none border-t-0 border-b-0 border-r-0 border-l border-gray-100 bg-white p-0 shadow-2xl flex flex-col justify-between duration-300">
          
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-50 flex-shrink-0">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-emerald-600" />
              <h3 className="text-lg font-bold text-gray-900">Your Basket</h3>
              {cartItems.length > 0 && (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  {cartItems.reduce((acc, i) => acc + i.quantity, 0)} items
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart items list */}
          <div className="flex-1 overflow-y-auto px-6 py-2">
            {!user ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <span className="text-4xl mb-4">🛒</span>
                <h4 className="font-bold text-gray-800">Please Sign In</h4>
                <p className="text-sm text-gray-400 mt-2">
                  Sign in to view your cart and checkout.
                </p>
              </div>
            ) : isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-600"></div>
              </div>
            ) : cartItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <span className="text-5xl mb-4">🛒</span>
                <h4 className="font-bold text-gray-800">Your basket is empty</h4>
                <p className="text-sm text-gray-400 mt-2 max-w-[240px] mx-auto">
                  Browse the marketplace and add items here to start shopping!
                </p>
                <Button size="sm" className="mt-6" onClick={onClose}>
                  Browse Marketplace
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {cartItems.map((item) => (
                  <CartItemRow
                    key={item.id}
                    item={item}
                    onUpdateQty={(newQty) => updateQty(item.id, newQty)}
                    onRemove={() => removeItem(item.id)}
                    isSelected={selectedIds.has(item.id)}
                    onToggle={() => toggleItem(item.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer Summary */}
          {user && cartItems.length > 0 && (
            <div className="px-6 py-6 border-t border-gray-100 bg-gray-50/50 flex-shrink-0 space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-gray-500 font-semibold">
                  <span>Subtotal</span>
                  <span className="text-gray-900 font-bold">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-500 font-semibold">
                  <span>Universal Shipping</span>
                  <span className="text-gray-900 font-bold">{formatPrice(SHIPPING_FEE)}</span>
                </div>
                <div className="flex items-center justify-between text-base font-extrabold text-gray-900 pt-2 border-t border-dashed border-gray-200">
                  <span>Total Due (COD)</span>
                  <span className="text-emerald-600 text-lg">{formatPrice(grandTotal)}</span>
                </div>
              </div>

              <Button
                asChild
                disabled={selectedCount === 0}
                className="w-full h-11 text-sm font-bold shadow-md shadow-emerald-100 hover:shadow-lg"
              >
                <Link href={checkoutHref} onClick={onClose}>
                  Checkout {selectedCount > 0 ? `(${selectedCount})` : ''}
                </Link>
              </Button>
            </div>
          )}

        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
