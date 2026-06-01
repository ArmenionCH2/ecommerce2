'use client';

import React, { useEffect, useState } from 'react';
import { useUserSession } from '@/features/auth/hooks/useUserSession';
import { supabaseClient } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Check, X, FileText, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import type { VerificationRequest, Profile } from '@/lib/types';
import { TIER_LABELS } from '@/lib/constants';

export default function AdminTierUpgradesPage() {
  const { user, isLoading: isSessionLoading } = useUserSession();
  const [requests, setRequests] = useState<(VerificationRequest & { seller: Profile })[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabaseClient
        .from('verification_requests')
        .select('*, seller:seller_id(*)')
        .eq('request_type', 'upgrade')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests((data as any) ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'admin') {
      Promise.resolve().then(() => {
        fetchRequests();
      });
    }
  }, [user]);

  const handleApprove = async (requestId: string, sellerId: string, newTier: number) => {
    try {
      // Update verification request status
      const { error: reqError } = await supabaseClient
        .from('verification_requests')
        .update({ status: 'approved', updated_at: new Date().toISOString() })
        .eq('id', requestId);

      if (reqError) throw reqError;

      // Update seller tier
      const { error: sellerError } = await supabaseClient
        .from('profiles')
        .update({ seller_tier: newTier })
        .eq('id', sellerId);

      if (sellerError) throw sellerError;

      await fetchRequests();
    } catch (err) {
      console.error('Failed to approve tier upgrade:', err);
    }
  };

  const handleReject = async (requestId: string, sellerId: string, notes?: string) => {
    try {
      // Get current rejection count
      const { data: currentReq } = await supabaseClient
        .from('verification_requests')
        .select('rejection_count')
        .eq('id', requestId)
        .single();

      const newCount = (currentReq?.rejection_count || 0) + 1;

      // Update verification request status and increment rejection count
      const { error: reqError } = await supabaseClient
        .from('verification_requests')
        .update({ 
          status: 'rejected', 
          admin_notes: notes, 
          rejection_count: newCount,
          updated_at: new Date().toISOString() 
        })
        .eq('id', requestId);

      if (reqError) throw reqError;

      await fetchRequests();
    } catch (err) {
      console.error('Failed to reject tier upgrade:', err);
    }
  };

  const filteredRequests = requests.filter(req => {
    if (filter === 'all') return true;
    return req.status === filter;
  });

  if (isSessionLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 max-w-md mx-auto my-10 space-y-4">
        <span className="text-5xl">🔒</span>
        <h3 className="text-xl font-bold text-gray-800">Admin Area Guarded</h3>
        <p className="text-sm text-gray-500 max-w-xs mx-auto">
          Please sign in as a system administrator to review tier upgrade requests.
        </p>
        <Link href="/admin">
          <Button variant="outline">Back to admin dashboard</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-300">
      <div>
        <Link href="/admin" className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-emerald-600 mb-2 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Platform Overview
        </Link>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight font-sans">Seller Tier Upgrades</h1>
        <p className="text-sm text-gray-400 mt-1 max-w-2xl">
          Review and approve seller tier upgrade requests. Sellers submit these to increase their listing limits and unlock higher price tiers.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-colors ${
              filter === status
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-gray-50 text-gray-700 border-gray-100 hover:bg-gray-100'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)} ({status === 'all' ? requests.length : requests.filter(r => r.status === status).length})
          </button>
        ))}
      </div>

      {/* Tier Upgrade Requests */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        {filteredRequests.length === 0 ? (
          <p className="text-sm text-gray-500 py-8 text-center bg-gray-50/20">No tier upgrade requests found.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredRequests.map((request) => (
              <div key={request.id} className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-gray-900">{request.business_name}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        request.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                        request.status === 'rejected' ? 'bg-rose-100 text-rose-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {request.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Seller: {request.seller?.full_name} · Phone: {request.seller?.phone_number || 'N/A'}
                    </p>
                  </div>
                  <div className="text-xs text-gray-400">
                    Requested {new Date(request.created_at).toLocaleDateString()}
                  </div>
                </div>

                {/* Tier Comparison */}
                <div className="flex items-center gap-4 bg-gray-50 rounded-lg p-4">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Current Tier</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {request.seller?.seller_tier ? TIER_LABELS[request.seller.seller_tier] : 'Not set'}
                    </p>
                  </div>
                  <TrendingUp className="w-6 h-6 text-emerald-600" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Requested Tier</p>
                    <p className="text-lg font-semibold text-emerald-600">
                      {request.applied_tier ? TIER_LABELS[request.applied_tier] : 'Not specified'}
                    </p>
                  </div>
                </div>

                {request.business_description && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-600">{request.business_description}</p>
                  </div>
                )}

                {request.business_document_url && (
                  <div>
                    <a
                      href={request.business_document_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      View Business Document
                    </a>
                  </div>
                )}

                {request.id_document_url && (
                  <div>
                    <a
                      href={request.id_document_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      View Government ID
                    </a>
                  </div>
                )}

                {request.selfie_url && (
                  <div>
                    <a
                      href={request.selfie_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      View Selfie with ID
                    </a>
                  </div>
                )}

                {request.admin_notes && (
                  <div className="bg-rose-50 rounded-lg p-3">
                    <p className="text-xs text-rose-700 font-semibold">Admin Notes:</p>
                    <p className="text-sm text-rose-600 mt-1">{request.admin_notes}</p>
                  </div>
                )}

                {request.rejection_count > 0 && (
                  <div className="bg-amber-50 rounded-lg p-3">
                    <p className="text-xs text-amber-700 font-semibold">
                      Rejection Count: {request.rejection_count}
                    </p>
                  </div>
                )}

                {request.status === 'pending' && (
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      size="sm"
                      onClick={() => handleApprove(request.id, request.seller_id, request.applied_tier || 1)}
                      className="bg-emerald-600 hover:bg-emerald-500"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Approve Upgrade
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const notes = prompt('Enter rejection reason (optional):');
                        handleReject(request.id, request.seller_id, notes || undefined);
                      }}
                      className="border-rose-200 text-rose-600 hover:bg-rose-50"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
