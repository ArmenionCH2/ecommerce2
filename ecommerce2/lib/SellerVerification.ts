import type { Profile } from '@/lib/types';

export type VerificationStatus = 'pending' | 'approved' | 'rejected' | 'none';

/**
 * Encapsulates seller verification state derived from a Profile.
 * Replaces the standalone getSellerVerification() function.
 */
export class SellerVerification {
  private profile: Profile | null;

  constructor(profile: Profile | null | undefined) {
    this.profile = profile ?? null;
  }

  isSeller(): boolean {
    return this.profile?.role === 'seller';
  }

  getStatus(): VerificationStatus {
    if (!this.profile || this.profile.role !== 'seller') return 'none';

    const metadata = this.profile.metadata as {
      is_verified?: boolean;
      verification_status?: string;
    };

    if (metadata?.verification_status === 'approved' || metadata?.is_verified === true) {
      return 'approved';
    }
    if (metadata?.verification_status === 'rejected') return 'rejected';
    return 'pending';
  }

  isVerified(): boolean {
    return this.getStatus() === 'approved';
  }

  isPending(): boolean {
    return this.getStatus() === 'pending';
  }

  isRejected(): boolean {
    return this.getStatus() === 'rejected';
  }
}
