'use server';

/**
 * REVIEW SUBMISSION SERVER ACTION
 *
 * Business Rule: Only customers who have a 'received' order
 * containing the product may submit a review.
 * RLS policy enforces this at the database layer as a second guard.
 */

import { createServerClient } from '@/lib/supabaseServer';

interface ReviewPayload {
  customerId : string;
  productId  : number;
  orderId    : number;
  rating     : number;  // 1–5
  comment    : string | null;
}

interface ReviewResult {
  success: boolean;
  error? : string;
}

export async function submitReview(payload: ReviewPayload): Promise<ReviewResult> {
  const supabase = createServerClient();

  // Check if review already exists (this is an edit)
  const { data: existingReview } = await supabase
    .from('reviews')
    .select('id, rating, comment')
    .eq('product_id', payload.productId)
    .eq('customer_id', payload.customerId)
    .eq('order_id', payload.orderId)
    .maybeSingle();

  const upsertData: any = {
    customer_id: payload.customerId,
    product_id : payload.productId,
    order_id   : payload.orderId,
    rating     : payload.rating,
    comment    : payload.comment,
  };

  // Only set updated_at if this is an edit AND content actually changed
  if (existingReview) {
    const ratingChanged = existingReview.rating !== payload.rating;
    const commentChanged = existingReview.comment !== payload.comment;

    if (!ratingChanged && !commentChanged) {
      // No changes made
      return { success: false, error: 'no_changes' };
    }

    upsertData.updated_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('reviews')
    .upsert(upsertData, {
      onConflict: 'product_id,customer_id,order_id',
    });

  if (error) {
    // RLS will block non-buyers with a policy violation error
    return { success: false, error: error.message };
  }

  return { success: true };
}
