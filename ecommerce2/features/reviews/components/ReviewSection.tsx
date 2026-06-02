'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabaseClient } from '@/lib/supabase';
import { useUserSession } from '@/features/auth/hooks/useUserSession';
import { submitReview } from '../actions';
import { ReviewStars } from './ReviewStars';
import { CommentList } from './CommentList';
import { Button } from '@/components/ui/button';
import type { Review } from '@/lib/types';

interface ReviewSectionProps {
  productId: number;
  orderId?: number;
  onReviewSubmitted?: () => void;
}

export function ReviewSection({ productId, orderId, onReviewSubmitted }: ReviewSectionProps) {
  const { user } = useUserSession();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form states
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    try {
      const { data, error } = await supabaseClient
        .from('reviews')
        .select('*, profile:profiles(full_name)')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews((data as unknown as Review[]) ?? []);
    } catch (err) {
      console.error('Failed to load reviews', err);
    } finally {
      setIsLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchReviews();
    });
  }, [fetchReviews]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !orderId) {
      setErrorMsg('Order context is required to submit a review.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await submitReview({
        customerId: user.id,
        productId,
        orderId,
        rating,
        comment: comment.trim() || null,
      });

      if (res.success) {
        setSuccessMsg('Review submitted successfully! Thank you for your feedback.');
        setComment('');
        setRating(5);
        await fetchReviews();
        onReviewSubmitted?.();
      } else {
        // RLS error explanation
        if (res.error?.includes('row-level security policy')) {
          setErrorMsg('You can only review products you have purchased and received.');
        } else {
          setErrorMsg(res.error || 'Failed to submit review. You may have already reviewed this product.');
        }
      }
    } catch (err) {
      console.error('Submit review error:', err);
      setErrorMsg('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate average rating
  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-6">
      {/* Average rating indicator banner */}
      {reviews.length > 0 && (
        <div className="flex items-center gap-6 p-4 bg-emerald-50/30 border border-emerald-100/50 rounded-2xl max-w-sm animate-in fade-in-50 duration-200">
          <div className="text-center">
            <span className="text-4xl font-black text-emerald-600 block">{avgRating}</span>
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Out of 5</span>
          </div>
          <div className="space-y-1">
            <ReviewStars rating={Math.round(Number(avgRating))} />
            <p className="text-xs text-gray-500 font-medium">Based on {reviews.length} product reviews</p>
          </div>
        </div>
      )}

      {/* Review Submission Form (Customers Only) */}
      {user && user.role === 'customer' && orderId && !onReviewSubmitted && (
        <form onSubmit={handleSubmit} className="p-5 border border-gray-100 bg-gray-50/30 rounded-2xl space-y-4">
          <h4 className="font-bold text-gray-900 text-sm">Write a Product Review</h4>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 text-xs font-semibold rounded-xl animate-pulse">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold rounded-xl">
              {successMsg}
            </div>
          )}

          <div className="space-y-1">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Your Rating</span>
            <ReviewStars rating={rating} onRatingChange={setRating} interactive={true} />
          </div>

          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Your Feedback</span>
            <textarea
              rows={3}
              placeholder="Share your experience. How was the product quality, packaging, and delivery?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={isSubmitting}
              className="flex w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 transition-all duration-200 placeholder:text-gray-400 focus:outline-hidden focus:ring-2 focus:border-emerald-500 focus:ring-emerald-200/50 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <Button type="submit" size="sm" disabled={isSubmitting} className="shadow-xs bg-emerald-600 hover:bg-emerald-500">
            {isSubmitting ? 'Submitting...' : 'Submit Review'}
          </Button>
        </form>
      )}

      {/* Comment List */}
      <CommentList reviews={reviews} isLoading={isLoading} />
    </div>
  );
}
