'use client';

import React from 'react';
import type { Review } from '@/lib/types';
import { ReviewStars } from './ReviewStars';
import { formatDate } from '@/lib/utils';
import { Clock } from 'lucide-react';
import { User } from 'lucide-react';

interface CommentListProps {
  reviews: Review[];
  isLoading: boolean;
}

export function CommentList({ reviews, isLoading }: CommentListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="py-4 space-y-2 animate-pulse">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gray-100" />
              <div className="w-24 h-4 bg-gray-100 rounded-sm" />
            </div>
            <div className="w-16 h-3 bg-gray-100 rounded-sm" />
            <div className="w-full h-8 bg-gray-50 rounded-sm" />
          </div>
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <p className="text-sm text-gray-500 py-6 text-center">
        No reviews yet for this product. Be the first to leave a review!
      </p>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {reviews.map((review) => {
        const commenterName = review.profile?.full_name || 'Verified Buyer';

        return (
          <div key={review.id} className="py-4 space-y-1.5 animate-in fade-in-50 duration-200">
            <div className="flex justify-between items-start gap-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
                  <User className="w-3.5 h-3.5" />
                </div>
                <span className="text-sm font-bold text-gray-800">{commenterName}</span>
              </div>
              <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                {formatDate(review.created_at)}
              </span>
            </div>

            <div className="pl-9 space-y-1">
              <div className="flex items-center gap-2">
                <ReviewStars rating={review.rating} />
                {review.updated_at && review.updated_at !== review.created_at && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 border border-amber-200 rounded-full text-[10px] font-bold text-amber-700">
                    <Clock className="w-2.5 h-2.5" />
                    Edited
                  </span>
                )}
              </div>
              {review.comment && (
                <p className="text-sm text-gray-600 leading-relaxed pt-1">{review.comment}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
