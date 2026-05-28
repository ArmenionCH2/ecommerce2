'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useUserSession } from '@/features/auth/hooks/useUserSession';
import { supabaseClient } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Check, X, FileText, Clock, Store } from 'lucide-react';
import Link from 'next/link';
import type { Profile } from '@/lib/types';

export default function AdminRegistrationsPage() {
  const { user, isLoading: isSessionLoading } = useUserSession();
  const [sellers, setSellers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  const fetchSellers = useCallback(async () => {
    try {
      const { data, error } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('role', 'seller')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSellers((data as any) ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchSellers();
    }
  }, [user, fetchSellers]);

  const handleApprove = useCallback(async (sellerId: string) => {
    try {
      const { error } = await supabaseClient
        .from('profiles')
        .update({ registration_status: 'approved' })
        .eq('id', sellerId);

      if (error) throw error;
      await fetchSellers();
    } catch (err) {
      console.error('Failed to approve registration:', err);
    }
  }, [fetchSellers]);

  const handleReject = useCallback(async (sellerId: string) => {
    try {
      const { error } = await supabaseClient
        .from('profiles')
        .update({ registration_status: 'rejected' })
        .eq('id', sellerId);

      if (error) throw error;
      await fetchSellers();
    } catch (err) {
      console.error('Failed to reject registration:', err);
    }
  }, [fetchSellers]);

  const filteredSellers = sellers.filter(seller => {
    if (filter === 'all') return true;
    return seller.registration_status === filter;
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
          Please sign in as a system administrator to review seller registrations.
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
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight font-sans">Seller Registrations</h1>
        <p className="text-sm text-gray-400 mt-1 max-w-2xl">
          Review and approve seller registration applications. Approved sellers can start listing products.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold border transition-colors ${
              filter === status
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-gray-50 text-gray-700 border-gray-100 hover:bg-gray-100'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)} ({status === 'all' ? sellers.length : sellers.filter(s => s.registration_status === status).length})
          </button>
        ))}
      </div>

      {/* Registrations */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        {filteredSellers.length === 0 ? (
          <p className="text-sm text-gray-500 py-8 text-center bg-gray-50/20">No seller registrations found.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredSellers.map((seller) => (
              <div key={seller.id} className="p-4 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {seller.photo_url ? (
                        <img src={seller.photo_url} alt={seller.full_name} className="w-full h-full object-cover" />
                      ) : (
                        <Store className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-gray-900">{seller.full_name}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          seller.registration_status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                          seller.registration_status === 'rejected' ? 'bg-rose-100 text-rose-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {seller.registration_status}
                        </span>
                        {seller.is_verified && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                            Verified
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Phone: {seller.phone_number || 'N/A'}
                      </p>
                      {seller.store_name && (
                        <p className="text-sm text-gray-600 mt-1">
                          Store: {seller.store_name}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">
                    Registered {new Date(seller.created_at).toLocaleDateString()}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Address</p>
                    <p className="text-sm text-gray-900">{seller.address || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Warehouse Address</p>
                    <p className="text-sm text-gray-900">{seller.warehouse_address || 'N/A'}</p>
                  </div>
                </div>

                {seller.government_id_url && (
                  <div>
                    <a
                      href={seller.government_id_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      View Government ID
                    </a>
                  </div>
                )}

                {seller.store_description && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Store Description</p>
                    <p className="text-sm text-gray-600">{seller.store_description}</p>
                  </div>
                )}

                {seller.registration_status === 'pending' && (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleApprove(seller.id)}
                      className="bg-emerald-600 hover:bg-emerald-500 w-full sm:w-auto"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Approve Registration
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReject(seller.id)}
                      className="border-rose-200 text-rose-600 hover:bg-rose-50 w-full sm:w-auto"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                )}

                {seller.registration_status === 'rejected' && (
                  <Button
                    size="sm"
                    onClick={() => handleApprove(seller.id)}
                    className="bg-emerald-600 hover:bg-emerald-500 w-full sm:w-auto"
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Approve (Override Rejection)
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
