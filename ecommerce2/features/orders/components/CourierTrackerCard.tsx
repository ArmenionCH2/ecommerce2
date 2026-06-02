'use client';

import React from 'react';
import type { Order } from '@/lib/types';
import { formatPrice, formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, Package, Truck, Smile, AlertCircle, X } from 'lucide-react';
import { ORDER_STATUS_LABELS } from '@/lib/constants';
import { Button } from '@/components/ui/button';

interface CourierTrackerCardProps {
  order: Order;
  onCancelOrder?: (orderId: number) => void;
  onRefresh?: () => void;
}

export function CourierTrackerCard({ order, onCancelOrder, onRefresh }: CourierTrackerCardProps) {
  const { order_items: items = [], status, created_at, id, total_amount } = order;
  const [isCancelling, setIsCancelling] = React.useState(false);
  const [isMarkingReceived, setIsMarkingReceived] = React.useState(false);

  // Courier timeline steps based on order status
  const steps = [
    { label: 'Placed', statusKey: 'placed', icon: CheckCircle2 },
    { label: 'On The Way', statusKey: 'to_receive', icon: Truck },
    { label: 'Delivered', statusKey: 'received', icon: Smile },
  ];

  // Helper to determine step completion state
  const getStepState = (stepIndex: number) => {
    const statusIndices: Record<string, number> = {
      placed: 0,
      packed: 1,
      to_receive: 1,
      received: 2,
      cancelled: -1,
    };

    const currentIdx = statusIndices[status] ?? 0;

    if (status === 'cancelled') return 'cancelled';
    if (currentIdx >= stepIndex) return 'completed';
    return 'pending';
  };

  const getBadgeVariant = () => {
    switch (status) {
      case 'placed': return 'default';
      case 'packed': return 'info';
      case 'to_receive': return 'warning';
      case 'received': return 'success';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <Card className="border border-gray-100 bg-white rounded-3xl overflow-hidden shadow-xs hover:shadow-xs transition-shadow duration-200">
      <CardContent className="p-6 space-y-6">
        
        {/* Top Info */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-50">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-extrabold text-gray-800">Order #{id}</span>
              <Badge variant={getBadgeVariant()}>
                {ORDER_STATUS_LABELS[status] || status}
              </Badge>
            </div>
            <p className="text-xs text-gray-400 mt-1">Placed on {formatDate(created_at)}</p>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-xs text-gray-400 font-semibold block uppercase tracking-wider">Amount Due (COD)</span>
            <span className="text-base font-extrabold text-emerald-600">{formatPrice(Number(total_amount))}</span>
          </div>
        </div>

        {/* Courier Timeline Tracker */}
        {status !== 'cancelled' ? (
          <div className="py-4">
            <div className="relative flex items-center justify-between max-w-md mx-auto">
              {/* Connector line behind steps */}
              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-gray-100 -z-1" />

              {steps.map((step, idx) => {
                const state = getStepState(idx);
                const StepIcon = step.icon;

                return (
                  <div key={step.label} className="flex flex-col items-center gap-2 bg-white px-2">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors duration-300 ${
                        state === 'completed'
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-sm shadow-emerald-50'
                          : 'bg-gray-50 text-gray-400 border border-gray-200'
                      }`}
                    >
                      <StepIcon className="w-4.5 h-4.5" />
                    </div>
                    <span
                      className={`text-[10px] font-bold ${
                        state === 'completed' ? 'text-emerald-700' : 'text-gray-400'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-700 text-sm max-w-md mx-auto">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="font-semibold">This order has been cancelled and will not be delivered.</p>
          </div>
        )}

        {/* Cancel button for waiting approval orders */}
        {status === 'placed' && onCancelOrder && (
          <div className="mt-4">
            <Button
              variant="outline"
              className="w-full border-rose-200 text-rose-600 hover:bg-rose-50"
              disabled={isCancelling}
              onClick={async () => {
                setIsCancelling(true);
                try {
                  await onCancelOrder(id);
                } finally {
                  setIsCancelling(false);
                }
              }}
            >
              <X className="w-4 h-4 mr-2" />
              {isCancelling ? 'Cancelling...' : 'Cancel Order'}
            </Button>
          </div>
        )}

        {/* Mark as Received button for orders on the way */}
        {status === 'to_receive' && (
          <div className="mt-4">
            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-500"
              disabled={isMarkingReceived}
              onClick={async () => {
                setIsMarkingReceived(true);
                try {
                  const { supabaseClient } = await import('@/lib/supabase');
                  await supabaseClient
                    .from('orders')
                    .update({ status: 'received' })
                    .eq('id', id);
                  window.dispatchEvent(new Event('orders-updated'));
                  onRefresh?.();
                } finally {
                  setIsMarkingReceived(false);
                }
              }}
            >
              <Smile className="w-4 h-4 mr-2" />
              {isMarkingReceived ? 'Marking...' : 'Mark as Received'}
            </Button>
          </div>
        )}

        {/* Items Summary list */}
        <div className="space-y-2">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Items In Order</span>
          <div className="divide-y divide-gray-50">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between items-center py-2 text-sm animate-in fade-in-50 duration-200">
                <span className="font-semibold text-gray-700">
                  {item.quantity}x {item.variation_details ? `${item.variation_details}` : `Product ID: ${item.product_id}`}
                </span>
                <span className="font-bold text-gray-800">{formatPrice(Number(item.price_at_purchase) * item.quantity)}</span>
              </div>
            ))}
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
