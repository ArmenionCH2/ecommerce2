'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserSession } from '@/features/auth/hooks/useUserSession';
import { supabaseClient } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { TIER_LABELS } from '@/lib/constants';
import { Clock, XCircle, CheckCircle2, RefreshCw, AlertCircle } from 'lucide-react';
import type { VerificationRequest } from '@/lib/types';

export default function SellerPendingPage() {
  const router = useRouter();
  const { user, isLoading: isSessionLoading } = useUserSession();
  const [request, setRequest] = useState<VerificationRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);

  const fetchRequest = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabaseClient
        .from('verification_requests')
        .select('*')
        .eq('seller_id', user.id)
        .eq('request_type', 'registration')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setRequest(data as VerificationRequest);
    } catch (err) {
      console.error('Failed to fetch request:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchRequest();
    }
  }, [user]);

  // Poll for role change if approved
  useEffect(() => {
    if (request?.status === 'approved' && user?.role === 'pending_seller') {
      setPolling(true);
      const interval = setInterval(async () => {
        const { data: { user: updatedUser } } = await supabaseClient.auth.getUser();
        if (!updatedUser) return;

        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('role')
          .eq('id', updatedUser.id)
          .single();

        if (profile?.role === 'seller' as any) {
          setPolling(false);
          clearInterval(interval);
          router.push('/seller');
          router.refresh();
        }
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [request, user, router]);

  const handleResubmit = () => {
    router.push('/seller/apply');
  };

  if (isSessionLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!user) {
    router.push('/auth/signin');
    return null;
  }

  if (user.role === 'seller' as any) {
    router.push('/seller');
    return null;
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
            <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">No Application Found</h1>
            <p className="text-gray-600 mb-6">You haven't submitted a seller application yet.</p>
            <Button onClick={() => router.push('/seller/apply')}>
              Apply to Become a Seller
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          {request.status === 'pending' && (
            <>
              <div className="text-center mb-8">
                <Clock className="w-16 h-16 text-amber-500 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Application Under Review</h1>
                <p className="text-gray-600">
                  Your seller application is being reviewed by our team. This typically takes 1-3 business days.
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Business Name</p>
                  <p className="text-lg font-semibold text-gray-900">{request.business_name}</p>
                </div>

                {request.applied_tier && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Applied Tier</p>
                    <p className="text-lg font-semibold text-gray-900">{TIER_LABELS[request.applied_tier]}</p>
                  </div>
                )}

                {request.business_description && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Business Description</p>
                    <p className="text-sm text-gray-700">{request.business_description}</p>
                  </div>
                )}

                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Submitted On</p>
                  <p className="text-sm text-gray-700">
                    {new Date(request.created_at).toLocaleDateString('en-PH', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-sm font-medium">
                    <Clock className="w-4 h-4" />
                    Pending Review
                  </span>
                </div>
              </div>
            </>
          )}

          {request.status === 'rejected' && (
            <>
              <div className="text-center mb-8">
                <XCircle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Application Rejected</h1>
                <p className="text-gray-600">
                  Your application was not approved. Please review the feedback below and resubmit.
                </p>
              </div>

              {request.admin_notes && (
                <div className="bg-rose-50 border border-rose-100 rounded-xl p-6 mb-6">
                  <p className="text-xs font-medium text-rose-700 uppercase tracking-wide mb-2">Rejection Reason</p>
                  <p className="text-sm text-rose-800">{request.admin_notes}</p>
                </div>
              )}

              {request.rejection_count > 0 && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-6 mb-6">
                  <p className="text-xs font-medium text-amber-700 uppercase tracking-wide mb-2">
                    Rejection Count
                  </p>
                  <p className="text-sm text-amber-800">
                    This is your {request.rejection_count}{request.rejection_count === 1 ? 'st' : request.rejection_count === 2 ? 'nd' : request.rejection_count === 3 ? 'rd' : 'th'} application.
                  </p>
                </div>
              )}

              <div className="bg-gray-50 rounded-xl p-6 space-y-4 mb-6">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Business Name</p>
                  <p className="text-lg font-semibold text-gray-900">{request.business_name}</p>
                </div>

                {request.applied_tier && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Applied Tier</p>
                    <p className="text-lg font-semibold text-gray-900">{TIER_LABELS[request.applied_tier]}</p>
                  </div>
                )}

                {request.business_description && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Business Description</p>
                    <p className="text-sm text-gray-700">{request.business_description}</p>
                  </div>
                )}
              </div>

              <Button onClick={handleResubmit} className="w-full">
                <RefreshCw className="w-4 h-4 mr-2" />
                Resubmit Application
              </Button>
            </>
          )}

          {request.status === 'approved' && polling && (
            <>
              <div className="text-center mb-8">
                <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4 animate-pulse" />
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Application Approved!</h1>
                <p className="text-gray-600">
                  Your application has been approved. Setting up your seller account...
                </p>
              </div>

              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-600"></div>
              </div>
            </>
          )}

          {request.status === 'approved' && !polling && user.role === 'seller' as any && (
            <>
              <div className="text-center mb-8">
                <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome, Seller!</h1>
                <p className="text-gray-600">
                  Your seller account is now active. Redirecting to your dashboard...
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
