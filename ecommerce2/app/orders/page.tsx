'use client';

import React from 'react';
import { useUserSession } from '@/features/auth/hooks/useUserSession';
import { useOrderStatus } from '@/features/orders/hooks/useOrderStatus';
import { OrderStatusTabs } from '@/features/orders/components/OrderStatusTabs';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function CustomerOrdersPage() {
  const { user, isLoading: isSessionLoading } = useUserSession();
  const customerId = user && user.role === 'customer' ? user.id : null;
  const { orders, isLoading: isOrdersLoading, cancelOrder, refreshOrders } = useOrderStatus(customerId);

  if (isSessionLoading) {
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
        <h3 className="text-xl font-bold text-gray-800">Orders Guarded</h3>
        <p className="text-sm text-gray-500 max-w-xs mx-auto">
          Please sign in as a customer to view and track your purchase orders.
        </p>
        <Link href="/" passHref legacyBehavior>
          <Button variant="outline" className="gap-1.5">
            <ArrowLeft className="w-4 h-4" />
            Back to marketplace
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-300">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Your Purchase Orders</h1>
        <p className="text-sm text-gray-400 mt-1">Track deliveries and view your order history in real time.</p>
      </div>

      <OrderStatusTabs orders={orders} isLoading={isOrdersLoading} onCancelOrder={cancelOrder} onRefresh={refreshOrders} />
    </div>
  );
}
