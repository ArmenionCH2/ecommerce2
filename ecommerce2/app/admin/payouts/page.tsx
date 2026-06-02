'use client';

import React, { useEffect, useState } from 'react';
import { useUserSession } from '@/features/auth/hooks/useUserSession';
import { supabaseClient } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Wallet, CheckCircle, XCircle, Clock, DollarSign } from 'lucide-react';
import Link from 'next/link';
import type { SellerPayout, Profile } from '@/lib/types';
import { formatPrice } from '@/lib/utils';

export default function AdminPayoutsPage() {
  const { user, isLoading: isSessionLoading } = useUserSession();
  const [payouts, setPayouts] = useState<(SellerPayout & { seller: Profile })[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'processing' | 'completed' | 'failed'>('all');
  const [selectedPayout, setSelectedPayout] = useState<SellerPayout | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPayouts = async () => {
    try {
      const { data, error } = await supabaseClient
        .from('seller_payouts')
        .select('*, seller:seller_id(*)')
        .order('requested_at', { ascending: false });

      if (error) throw error;
      setPayouts((data as any) ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchPayouts();
    }
  }, [user]);

  const handleProcess = async (payoutId: string) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabaseClient
        .from('seller_payouts')
        .update({ status: 'processing', processed_at: new Date().toISOString() })
        .eq('id', payoutId);

      if (error) throw error;
      
      // Write to audit log
      if (user) {
        await supabaseClient.from('admin_audit_log').insert({
          admin_id: user.id,
          action_type: 'PROCESS_PAYOUT',
          target_type: 'seller_payout',
          target_id: payoutId,
          new_values: { status: 'processing' },
        });
      }
      
      await fetchPayouts();
    } catch (err) {
      console.error('Failed to process payout:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComplete = async (payoutId: string) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabaseClient
        .from('seller_payouts')
        .update({ status: 'completed', processed_at: new Date().toISOString() })
        .eq('id', payoutId);

      if (error) throw error;
      
      // Write to audit log
      if (user) {
        await supabaseClient.from('admin_audit_log').insert({
          admin_id: user.id,
          action_type: 'COMPLETE_PAYOUT',
          target_type: 'seller_payout',
          target_id: payoutId,
          new_values: { status: 'completed' },
        });
      }
      
      await fetchPayouts();
    } catch (err) {
      console.error('Failed to complete payout:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async (payoutId: string) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabaseClient
        .from('seller_payouts')
        .update({ status: 'failed', processed_at: new Date().toISOString() })
        .eq('id', payoutId);

      if (error) throw error;
      
      // Write to audit log
      if (user) {
        await supabaseClient.from('admin_audit_log').insert({
          admin_id: user.id,
          action_type: 'REJECT_PAYOUT',
          target_type: 'seller_payout',
          target_id: payoutId,
          new_values: { status: 'failed' },
        });
      }
      
      await fetchPayouts();
    } catch (err) {
      console.error('Failed to reject payout:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPayouts = payouts.filter(payout => {
    if (filter === 'all') return true;
    return payout.status === filter;
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
          Please sign in as a system administrator to manage payouts.
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
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight font-sans">Seller Payouts</h1>
        <p className="text-sm text-gray-400 mt-1 max-w-2xl">
          Manage seller payout requests. Process pending payouts and track payment status.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'pending', 'processing', 'completed', 'failed'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-colors ${
              filter === status
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-gray-50 text-gray-700 border-gray-100 hover:bg-gray-100'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)} ({status === 'all' ? payouts.length : payouts.filter(p => p.status === status).length})
          </button>
        ))}
      </div>

      {/* Payouts List */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        {filteredPayouts.length === 0 ? (
          <p className="text-sm text-gray-500 py-8 text-center bg-gray-50/20">No payout requests found.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredPayouts.map((payout) => (
              <div key={payout.id} className="p-6 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-gray-900">{payout.seller?.full_name || 'Unknown Seller'}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        payout.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                        payout.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                        payout.status === 'failed' ? 'bg-rose-100 text-rose-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {payout.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Phone: {payout.seller?.phone_number || 'N/A'} · Requested {new Date(payout.requested_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right sm:text-left sm:order-first order-last">
                    <p className="text-lg font-extrabold text-emerald-600">{formatPrice(payout.amount)}</p>
                    {payout.payout_method && (
                      <p className="text-xs text-gray-500 mt-1">{payout.payout_method}</p>
                    )}
                  </div>
                </div>

                {payout.payout_details && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 font-semibold mb-2">Payout Details:</p>
                    <div className="space-y-1">
                      {(payout.payout_details as any).gcash_number && (
                        <p className="text-xs text-gray-600">
                          <span className="font-medium">GCash Number:</span> {String((payout.payout_details as any).gcash_number)}
                        </p>
                      )}
                      {(payout.payout_details as any).account_name && (
                        <p className="text-xs text-gray-600">
                          <span className="font-medium">Account Name:</span> {String((payout.payout_details as any).account_name)}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {payout.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleProcess(payout.id)}
                      disabled={isSubmitting}
                      className="bg-blue-600 hover:bg-blue-500"
                    >
                      <Clock className="w-4 h-4 mr-1" />
                      Process
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleComplete(payout.id)}
                      disabled={isSubmitting}
                      className="bg-emerald-600 hover:bg-emerald-500"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Complete
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReject(payout.id)}
                      disabled={isSubmitting}
                      className="border-rose-200 text-rose-600 hover:bg-rose-50"
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                )}

                {payout.status === 'processing' && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleComplete(payout.id)}
                      disabled={isSubmitting}
                      className="bg-emerald-600 hover:bg-emerald-500"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Complete
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
