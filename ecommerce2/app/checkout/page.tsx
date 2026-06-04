'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { useUserSession } from '@/features/auth/hooks/useUserSession';
import { useCartActions } from '@/features/cart/hooks/useCartActions';
import { DeliveryAddressForm, AddressFormData } from '@/features/checkout/components/DeliveryAddressForm';
import { CheckoutSummaryCard } from '@/features/checkout/components/CheckoutSummaryCard';
import { placeOrderClient } from '@/features/checkout/checkoutClient';
import { supabaseClient } from '@/lib/supabase';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function CheckoutTerminal() {
  const router = useRouter();
  const { user, isLoading: isSessionLoading } = useUserSession();
  const customerId = user && user.role === 'customer' ? user.id : null;
  const { cartItems, isLoading: isCartLoading, clearCart } = useCartActions(customerId);
  const searchParams = useSearchParams();
  const selectedParam = searchParams.get('items');
  const selectedIds = React.useMemo(() => {
    if (!selectedParam) return null;
    return new Set(selectedParam.split(',').map(Number).filter(Boolean));
  }, [selectedParam]);
  const checkoutItems = selectedIds
    ? cartItems.filter(item => selectedIds.has(item.id))
    : cartItems;
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [addressData, setAddressData] = useState<AddressFormData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAddressSubmit = async (data: AddressFormData) => {
    setAddressData(data);
    setErrorMsg(null);

    // Save to profile for future checkouts (fire and forget)
    if (user) {
      supabaseClient
        .from('profiles')
        .update({
          full_name: data.fullName,
          phone_number: data.phoneNumber,
          delivery_address: data.address,
        })
        .eq('id', user.id)
        .then(({ error }) => {
          if (error) console.error('[Checkout] Failed to save address to profile:', error.message);
        });
    }
  };

  const handlePlaceOrder = async () => {
    if (!user || !addressData || checkoutItems.length === 0) return;

    setIsPlacingOrder(true);
    setErrorMsg(null);

    const payload = {
      customerId: user.id,
      shippingAddress: `${addressData.fullName} | Tel: ${addressData.phoneNumber} | Addr: ${addressData.address}${
        addressData.instructions ? ` (Notes: ${addressData.instructions})` : ''
      }`,
      items: checkoutItems.map((item) => ({
        product_id: item.product_id,
        seller_id: item.product?.seller_id || '',
        quantity: item.quantity,
        variation_id: item.variation_id,
      })),
    };

    try {
      const res = await placeOrderClient(payload);
      if (res.success) {
        await clearCart();
        router.push('/orders');
      } else {
        setErrorMsg(res.error || 'Failed to place order.');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setErrorMsg('An unexpected error occurred during checkout.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (isSessionLoading || isCartLoading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!user || user.role !== 'customer') {
    return (
      <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 max-w-md mx-auto my-10 space-y-4">
        <span className="text-5xl">🔒</span>
        <h3 className="text-xl font-bold text-gray-800">Checkout Guarded</h3>
        <p className="text-sm text-gray-500 max-w-xs mx-auto">
          Please sign in as a customer to proceed to checkout.
        </p>
        <Link href="/">
          <Button variant="outline" className="gap-1.5">
            <ArrowLeft className="w-4 h-4" />
            Back to marketplace
          </Button>
        </Link>
      </div>
    );
  }

  if (checkoutItems.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 max-w-md mx-auto my-10 space-y-4">
        <span className="text-5xl">🛒</span>
        <h3 className="text-xl font-bold text-gray-800">Your Basket is Empty</h3>
        <p className="text-sm text-gray-500 max-w-xs mx-auto">
          Add items to your cart before checking out.
        </p>
        <Link href="/">
          <Button variant="outline" className="gap-1.5">
            <ArrowLeft className="w-4 h-4" />
            Browse Marketplace
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-300">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Checkout Terminal</h1>
        <p className="text-sm text-gray-400 mt-1">Review your COD totals and complete shipping details below.</p>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-100 text-rose-700 text-sm font-semibold rounded-2xl animate-pulse">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form */}
        <div className="lg:col-span-7">
          <DeliveryAddressForm
            defaultValues={{
              fullName: user.full_name,
              phoneNumber: user.phone_number || '',
              address: user.delivery_address || '',
            }}
            onSubmit={handleAddressSubmit}
            isLoading={isPlacingOrder}
            hasSavedAddress={!!(user.phone_number && user.delivery_address)}
          />
        </div>

        {/* Right Summary */}
        <div className="lg:col-span-5">
          <CheckoutSummaryCard
            items={checkoutItems}
            isLoading={isPlacingOrder}
            onPlaceOrder={addressData ? handlePlaceOrder : undefined}
            disabled={!addressData}
          />
        </div>
      </div>
    </div>
  );
}
