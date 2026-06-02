'use client';

import React, { useEffect, useState } from 'react';
import { useUserSession } from '@/features/auth/hooks/useUserSession';
import { supabaseClient } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Check, X, DollarSign, AlertTriangle, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import type { RefundDispute, Profile, Order } from '@/lib/types';

export default function AdminRefundsPage() {
  const { user, isLoading: isSessionLoading } = useUserSession();
  const [refunds, setRefunds] = useState<(RefundDispute & { customer: Profile; seller: Profile; order: Order })[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'processed'>('all');
  const [selectedRefund, setSelectedRefund] = useState<RefundDispute | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchRefunds = async () => {
    try {
      const { data, error } = await supabaseClient
        .from('refunds_disputes')
        .select('*, customer:customer_id(*), seller:seller_id(*), order:order_id(*)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRefunds((data as any) ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchRefunds();
    }
  }, [user]);

  const handleApprove = async (refundId: string) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabaseClient
        .from('refunds_disputes')
        .update({ 
          status: 'approved', 
          admin_notes: adminNotes,
          processed_by: user.id,
          processed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', refundId);

      if (error) throw error;

      // Audit log — non-fatal
      try {
        await supabaseClient.from('admin_audit_log').insert({
          admin_id    : user.id,
          action_type : 'APPROVE_REFUND',
          target_type : 'refund_dispute',
          target_id   : refundId,
          new_values  : {
            status      : 'approved',
            admin_notes : adminNotes || null,
          },
          reason      : adminNotes || null,
        });
      } catch {
        // intentionally swallowed
      }

      setSelectedRefund(null);
      setAdminNotes('');
      await fetchRefunds();
    } catch (err) {
      console.error('Failed to approve refund:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async (refundId: string) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabaseClient
        .from('refunds_disputes')
        .update({ 
          status: 'rejected', 
          admin_notes: adminNotes,
          processed_by: user.id,
          processed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', refundId);

      if (error) throw error;

      // Audit log — non-fatal
      try {
        await supabaseClient.from('admin_audit_log').insert({
          admin_id    : user.id,
          action_type : 'REJECT_REFUND',
          target_type : 'refund_dispute',
          target_id   : refundId,
          new_values  : {
            status      : 'rejected',
            admin_notes : adminNotes || null,
          },
          reason      : adminNotes || null,
        });
      } catch {
        // intentionally swallowed
      }

      setSelectedRefund(null);
      setAdminNotes('');
      await fetchRefunds();
    } catch (err) {
      console.error('Failed to reject refund:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkProcessed = async (refundId: string) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabaseClient
        .from('refunds_disputes')
        .update({ 
          status: 'processed',
          processed_by: user.id,
          processed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', refundId);

      if (error) throw error;

      // Audit log — non-fatal
      try {
        await supabaseClient.from('admin_audit_log').insert({
          admin_id    : user.id,
          action_type : 'PROCESS_REFUND',
          target_type : 'refund_dispute',
          target_id   : refundId,
          new_values  : { status: 'processed' },
        });
      } catch {
        // intentionally swallowed
      }

      await fetchRefunds();
    } catch (err) {
      console.error('Failed to mark refund as processed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredRefunds = refunds.filter(refund => {
    if (filter === 'all') return true;
    return refund.status === filter;
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
          Please sign in as a system administrator to manage refunds and disputes.
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
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight font-sans">Refunds & Disputes</h1>
        <p className="text-sm text-gray-400 mt-1 max-w-2xl">
          Manage refund requests and disputes. Track money flowing backward due to cancellations or returns.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'pending', 'approved', 'rejected', 'processed'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-colors ${
              filter === status
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-gray-50 text-gray-700 border-gray-100 hover:bg-gray-100'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)} ({status === 'all' ? refunds.length : refunds.filter(r => r.status === status).length})
          </button>
        ))}
      </div>

      {/* Refunds List */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        {filteredRefunds.length === 0 ? (
          <p className="text-sm text-gray-500 py-8 text-center bg-gray-50/20">No refunds or disputes found.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredRefunds.map((refund) => (
              <div key={refund.id} className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      refund.dispute_type === 'refund' ? 'bg-blue-100' :
                      refund.dispute_type === 'dispute' ? 'bg-amber-100' : 'bg-purple-100'
                    }`}>
                      {refund.dispute_type === 'refund' ? (
                        <DollarSign className="w-6 h-6 text-blue-600" />
                      ) : refund.dispute_type === 'dispute' ? (
                        <AlertTriangle className="w-6 h-6 text-amber-600" />
                      ) : (
                        <RefreshCw className="w-6 h-6 text-purple-600" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-900">
                          {refund.dispute_type.charAt(0).toUpperCase() + refund.dispute_type.slice(1)} - Order #{refund.order_id}
                        </h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          refund.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                          refund.status === 'rejected' ? 'bg-rose-100 text-rose-700' :
                          refund.status === 'processed' ? 'bg-blue-100 text-blue-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {refund.status}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          refund.dispute_type === 'refund' ? 'bg-blue-100 text-blue-700' :
                          refund.dispute_type === 'dispute' ? 'bg-amber-100 text-amber-700' : 'bg-purple-100 text-purple-700'
                        }`}>
                          {refund.dispute_type}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Customer: {refund.customer?.full_name} · Seller: {refund.seller?.full_name}
                      </p>
                      <p className="text-sm font-semibold text-gray-900 mt-1">
                        Amount: ${refund.refund_amount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(refund.created_at).toLocaleDateString()}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs font-semibold text-gray-700 mb-1">Reason:</p>
                  <p className="text-sm text-gray-600">{refund.reason}</p>
                </div>

                {refund.admin_notes && (
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-blue-700 mb-1">Admin Notes:</p>
                    <p className="text-sm text-blue-600">{refund.admin_notes}</p>
                    {refund.processed_at && (
                      <p className="text-xs text-blue-500 mt-1">
                        Processed on: {new Date(refund.processed_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}

                <div className="flex gap-2">
                  {refund.status === 'pending' && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => setSelectedRefund(refund)}
                        className="bg-emerald-600 hover:bg-emerald-500"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedRefund(refund)}
                        className="border-rose-200 text-rose-600 hover:bg-rose-50"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </>
                  )}
                  {refund.status === 'approved' && (
                    <Button
                      size="sm"
                      onClick={() => handleMarkProcessed(refund.id)}
                      disabled={isSubmitting}
                      className="bg-blue-600 hover:bg-blue-500"
                    >
                      <RefreshCw className="w-4 h-4 mr-1" />
                      Mark as Processed
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Approve/Reject Dialog */}
      {selectedRefund && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">
              {selectedRefund.dispute_type.charAt(0).toUpperCase() + selectedRefund.dispute_type.slice(1)} Request
            </h3>
            <p className="text-sm text-gray-600">
              Order #{selectedRefund.order_id} · Amount: ${selectedRefund.refund_amount.toFixed(2)}
            </p>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs font-semibold text-gray-700 mb-1">Reason:</p>
              <p className="text-sm text-gray-600">{selectedRefund.reason}</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600">Admin Notes (Optional)</label>
              <Input
                type="text"
                placeholder="Add notes for this decision..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedRefund(null);
                  setAdminNotes('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleApprove(selectedRefund.id)}
                disabled={isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-500"
              >
                {isSubmitting ? 'Processing...' : 'Approve'}
              </Button>
              <Button
                onClick={() => handleReject(selectedRefund.id)}
                disabled={isSubmitting}
                className="bg-rose-600 hover:bg-rose-500"
              >
                {isSubmitting ? 'Processing...' : 'Reject'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
