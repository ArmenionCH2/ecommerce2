'use client';

import React from 'react';
import type { Order } from '@/lib/types';
import { formatPrice, formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, Package, Truck, Smile, AlertCircle, X, Star } from 'lucide-react';
import { ORDER_STATUS_LABELS } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ReviewSection } from '@/features/reviews/components/ReviewSection';

interface CourierTrackerCardProps {
  order: Order;
  onCancelOrder?: (orderId: number) => void;
  onRefresh?: () => void;
}

export function CourierTrackerCard({ order, onCancelOrder, onRefresh }: CourierTrackerCardProps) {
  const { order_items: items = [], status, created_at, id, total_amount, customer_id } = order;
  const [isCancelling, setIsCancelling] = React.useState(false);
  const [isMarkingReceived, setIsMarkingReceived] = React.useState(false);
  const [showDisputeForm, setShowDisputeForm] = React.useState(false);
  const [disputeType, setDisputeType] = React.useState<'refund' | 'dispute' | 'return'>('refund');
  const [disputeReason, setDisputeReason] = React.useState('');
  const [isSubmittingDispute, setIsSubmittingDispute] = React.useState(false);
  const [disputeSuccess, setDisputeSuccess] = React.useState(false);
  const [disputeError, setDisputeError] = React.useState<string | null>(null);
  const [existingDispute, setExistingDispute] = React.useState(false);
  const [reviewingProductId, setReviewingProductId] = React.useState<number | null>(null);
  const [showReviewModal, setShowReviewModal] = React.useState(false);
  const [reviewedProductIds, setReviewedProductIds] = React.useState<Set<number>>(new Set());

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

  React.useEffect(() => {
    if (status !== 'received') return;
    const checkExisting = async () => {
      const { supabaseClient } = await import('@/lib/supabase');
      const { data } = await supabaseClient
        .from('refunds_disputes')
        .select('id')
        .eq('order_id', id)
        .maybeSingle();
      if (data) setExistingDispute(true);

      // Fetch existing reviews for this order
      const { data: reviews } = await supabaseClient
        .from('reviews')
        .select('product_id')
        .eq('order_id', id);
      if (reviews) {
        setReviewedProductIds(new Set(reviews.map((r: { product_id: number }) => r.product_id)));
      }
    };
    checkExisting();
  }, [id, status]);

  const handleDisputeSubmit = async () => {
    if (!disputeReason.trim()) {
      setDisputeError('Please describe the issue.');
      return;
    }

    setIsSubmittingDispute(true);
    setDisputeError(null);

    try {
      const { supabaseClient } = await import('@/lib/supabase');

      const sellerId = items[0]?.seller_id;
      if (!sellerId) throw new Error('Could not determine seller.');

      const { error } = await supabaseClient
        .from('refunds_disputes')
        .insert({
          order_id: id,
          customer_id: customer_id,
          seller_id: sellerId,
          refund_amount: Number(total_amount),
          reason: disputeReason.trim(),
          dispute_type: disputeType,
          status: 'pending',
        });

      if (error) throw error;

      setDisputeSuccess(true);
      setExistingDispute(true);
      setShowDisputeForm(false);
    } catch (err) {
      setDisputeError(err instanceof Error ? err.message : 'Failed to submit. Please try again.');
    } finally {
      setIsSubmittingDispute(false);
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
                  const { error } = await supabaseClient
                    .from('orders')
                    .update({ status: 'received' })
                    .eq('id', id)
                    .eq('status', 'to_receive');
                  if (error) {
                    console.error('Mark as received failed:', error.message);
                  } else {
                    window.dispatchEvent(new Event('orders-updated'));
                    onRefresh?.();
                  }
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
              <div key={item.id} className="flex justify-between items-center py-3 text-sm animate-in fade-in-50 duration-200">
                <div className="flex-1">
                  <span className="font-semibold text-gray-700">
                    {item.quantity}x {item.variation_details ? `${item.variation_details}` : `Product ID: ${item.product_id}`}
                  </span>
                  {status === 'received' && (
                    <div className="mt-2">
                      {reviewedProductIds.has(item.product_id) ? (
                        <Button
                          size="sm"
                          onClick={() => {
                            setReviewingProductId(item.product_id);
                            setShowReviewModal(true);
                          }}
                          className="h-8 px-3 text-xs font-semibold gap-1.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                        >
                          <Star className="w-3.5 h-3.5 fill-emerald-600" />
                          Edit Review
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => {
                            setReviewingProductId(item.product_id);
                            setShowReviewModal(true);
                          }}
                          className="h-8 px-3 text-xs font-semibold gap-1.5 bg-emerald-600 hover:bg-emerald-500"
                        >
                          <Star className="w-3.5 h-3.5" />
                          Write Review
                        </Button>
                      )}
                    </div>
                  )}
                </div>
                <span className="font-bold text-gray-800">{formatPrice(Number(item.price_at_purchase) * item.quantity)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Refund/Dispute Form */}
        {status === 'received' && (
          <div className="border-t border-gray-50 pt-4 space-y-3">
            {disputeSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-sm text-emerald-700 font-semibold">
                Your request has been submitted. Admin will review it shortly.
              </div>
            )}

            {!existingDispute && !disputeSuccess && (
              <>
                {!showDisputeForm ? (
                  <Button
                    variant="outline"
                    className="w-full border-amber-200 text-amber-700 hover:bg-amber-50"
                    onClick={() => setShowDisputeForm(true)}
                  >
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Request Refund / Raise Dispute
                  </Button>
                ) : (
                  <div className="space-y-3 p-4 bg-amber-50 border border-amber-100 rounded-xl">
                    <p className="text-xs font-bold text-amber-800 uppercase tracking-wide">
                      Submit a Request
                    </p>

                    {/* Dispute type selector */}
                    <div className="flex gap-2">
                      {(['refund', 'dispute', 'return'] as const).map((type) => (
                        <button
                          key={type}
                          onClick={() => setDisputeType(type)}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                            disputeType === type
                              ? 'bg-amber-600 text-white border-amber-600'
                              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </button>
                      ))}
                    </div>

                    {/* Reason textarea */}
                    <textarea
                      placeholder="Describe the issue with your order..."
                      value={disputeReason}
                      onChange={(e) => setDisputeReason(e.target.value)}
                      disabled={isSubmittingDispute}
                      rows={3}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-amber-500 focus:ring-amber-200/50 resize-none"
                    />

                    {disputeError && (
                      <p className="text-xs text-rose-600 font-semibold">{disputeError}</p>
                    )}

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setShowDisputeForm(false);
                          setDisputeReason('');
                          setDisputeError(null);
                        }}
                        disabled={isSubmittingDispute}
                      >
                        Cancel
                      </Button>
                      <Button
                        className="flex-1 bg-amber-600 hover:bg-amber-500"
                        onClick={handleDisputeSubmit}
                        disabled={isSubmittingDispute || !disputeReason.trim()}
                      >
                        {isSubmittingDispute ? 'Submitting...' : 'Submit'}
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}

            {existingDispute && !disputeSuccess && (
              <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm text-gray-500 text-center font-semibold">
                A request has already been submitted for this order.
              </div>
            )}
          </div>
        )}

        {/* Review Modal */}
        <Dialog open={showReviewModal} onOpenChange={(open) => {
          setShowReviewModal(open);
          if (!open) {
            setReviewingProductId(null);
          }
        }}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Star className="w-5 h-5 text-emerald-600" />
                {reviewedProductIds.has(reviewingProductId || 0) ? 'Edit Your Review' : 'Write a Review'}
              </DialogTitle>
            </DialogHeader>
            {reviewingProductId && (
              <ReviewSection
                productId={reviewingProductId}
                orderId={id}
                onReviewSubmitted={() => {
                  setReviewedProductIds(prev => new Set([...prev, reviewingProductId]));
                  setShowReviewModal(false);
                  setReviewingProductId(null);
                }}
              />
            )}
          </DialogContent>
        </Dialog>

      </CardContent>
    </Card>
  );
}
