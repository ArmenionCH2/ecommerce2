import type { UserRole } from '@/lib/types';
import { supabaseClient } from '@/lib/supabase';

/** Default landing route after sign-in / logo click per role. */
export function getHomePathForRole(role: UserRole | undefined | null): string {
  if (role === 'admin') return '/admin';
  if (role === 'seller') return '/seller';
  if (role === 'pending_seller') return '/seller/pending';
  return '/';
}

export function canBrowseMarketplace(role: UserRole | undefined | null): boolean {
  return !role || role === 'customer';
}

/**
 * Recovery routing for pending_seller users.
 * Checks DB to determine which step of the application to resume from.
 */
export async function getPendingSellerRoute(userId: string): Promise<string> {
  try {
    const { data: request } = await supabaseClient
      .from('verification_requests')
      .select('id_document_url, selfie_url')
      .eq('seller_id', userId)
      .eq('request_type', 'registration')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!request) {
      // No request exists - send to shop step (account already created)
      return '/seller/apply/shop';
    }

    if (!request.id_document_url || !request.selfie_url) {
      // Request exists but identity docs missing - send to identity step
      return '/seller/apply/identity';
    }

    // Application complete - send to pending page
    return '/seller/pending';
  } catch (error) {
    console.error('Error checking pending seller status:', error);
    // Fallback to pending page on error
    return '/seller/pending';
  }
}
