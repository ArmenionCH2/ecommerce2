'use client';

import React, { useEffect, useState } from 'react';
import { useUserSession } from '@/features/auth/hooks/useUserSession';
import { supabaseClient } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle, Clock, XCircle, FileText, Upload, Shield, Wallet, Send } from 'lucide-react';
import type { VerificationRequest, SellerBalance, SellerPayout } from '@/lib/types';

export default function SellerSettingsPage() {
  const { user, isLoading: isSessionLoading } = useUserSession();
  const [isVerified, setIsVerified] = useState(false);
  const [existingRequest, setExistingRequest] = useState<VerificationRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    businessName: '',
    businessDescription: '',
    businessDocumentUrl: '',
  });

  const [sellerBalance, setSellerBalance] = useState<SellerBalance | null>(null);
  const [payoutForm, setPayoutForm] = useState({
    amount: '',
    payoutMethod: 'GCash',
    gcashNumber: '',
    accountName: '',
  });
  const [recentPayouts, setRecentPayouts] = useState<SellerPayout[]>([]);

  const fetchVerificationStatus = async () => {
    if (!user) return;
    try {
      // Check if seller is verified
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('is_verified')
        .eq('id', user.id)
        .single();

      if (profile) {
        setIsVerified(profile.is_verified);
      }

      // Check for existing verification request
      const { data: request } = await supabaseClient
        .from('verification_requests')
        .select('*')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (request) {
        setExistingRequest(request as VerificationRequest);
      }
    } catch (err) {
      console.error('Failed to fetch verification status:', err);
    }
  };

  const fetchSellerBalance = async () => {
    if (!user) return;
    try {
      const { data: balance } = await supabaseClient
        .from('seller_balances')
        .select('*')
        .eq('seller_id', user.id)
        .single();

      if (balance) {
        setSellerBalance(balance as SellerBalance);
      }
    } catch (err) {
      console.error('Failed to fetch seller balance:', err);
    }
  };

  const fetchRecentPayouts = async () => {
    if (!user) return;
    try {
      const { data: payouts } = await supabaseClient
        .from('seller_payouts')
        .select('*')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (payouts) {
        setRecentPayouts(payouts as SellerPayout[]);
      }
    } catch (err) {
      console.error('Failed to fetch recent payouts:', err);
    }
  };

  useEffect(() => {
    if (user && user.role === 'seller') {
      fetchVerificationStatus();
      fetchSellerBalance();
      fetchRecentPayouts();
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (existingRequest && existingRequest.status === 'pending') {
        setErrorMsg('You already have a pending verification request.');
        return;
      }

      const { error } = await supabaseClient
        .from('verification_requests')
        .insert({
          seller_id: user.id,
          business_name: formData.businessName,
          business_description: formData.businessDescription,
          business_document_url: formData.businessDocumentUrl || null,
          status: 'pending',
        });

      if (error) throw error;

      setSuccessMsg('Verification request submitted successfully! We will review your application.');
      await fetchVerificationStatus();
      setFormData({ businessName: '', businessDescription: '', businessDocumentUrl: '' });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to submit verification request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDocumentUpload = async (file: File) => {
    if (!user) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabaseClient
        .storage
        .from('verification-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabaseClient
        .storage
        .from('verification-documents')
        .getPublicUrl(fileName);

      setFormData({ ...formData, businessDocumentUrl: publicUrl });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to upload document.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePayoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !sellerBalance) return;

    const amount = parseFloat(payoutForm.amount);
    if (isNaN(amount) || amount <= 0) {
      setErrorMsg('Please enter a valid amount.');
      return;
    }
    if (amount > sellerBalance.available_balance) {
      setErrorMsg(`Amount exceeds available balance (₱${sellerBalance.available_balance.toFixed(2)}).`);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const { error } = await supabaseClient
        .from('seller_payouts')
        .insert({
          seller_id: user.id,
          amount: amount,
          status: 'pending',
          payout_method: payoutForm.payoutMethod,
          payout_details: {
            gcash_number: payoutForm.gcashNumber,
            account_name: payoutForm.accountName,
          },
        });

      if (error) throw error;

      setSuccessMsg('Payout request submitted successfully!');
      setPayoutForm({ amount: '', payoutMethod: 'GCash', gcashNumber: '', accountName: '' });
      await fetchSellerBalance();
      await fetchRecentPayouts();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to submit payout request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSessionLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!user || user.role !== 'seller') {
    return (
      <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 max-w-md mx-auto my-10 space-y-4">
        <span className="text-5xl">🔒</span>
        <h3 className="text-xl font-bold text-gray-800">Seller Area</h3>
        <p className="text-sm text-gray-500 max-w-xs mx-auto">
          Please sign in as a seller to access settings.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-300">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight font-sans">Seller Settings</h1>
        <p className="text-sm text-gray-400 mt-1">Manage your seller account and verification status.</p>
      </div>

      {/* Verification Status Card */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-6 h-6 text-emerald-600" />
          <h2 className="text-lg font-bold text-gray-900">Verification Status</h2>
        </div>

        {isVerified ? (
          <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
            <div>
              <p className="font-bold text-emerald-900">Verified Seller</p>
              <p className="text-sm text-emerald-700">Your account is verified and trusted by buyers.</p>
            </div>
          </div>
        ) : existingRequest ? (
          <div className="space-y-4">
            <div className={`flex items-center gap-3 p-4 rounded-xl border ${
              existingRequest.status === 'pending' ? 'bg-amber-50 border-amber-100' :
              existingRequest.status === 'rejected' ? 'bg-rose-50 border-rose-100' :
              'bg-emerald-50 border-emerald-100'
            }`}>
              {existingRequest.status === 'pending' ? (
                <Clock className="w-8 h-8 text-amber-600" />
              ) : existingRequest.status === 'rejected' ? (
                <XCircle className="w-8 h-8 text-rose-600" />
              ) : (
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              )}
              <div>
                <p className={`font-bold ${
                  existingRequest.status === 'pending' ? 'text-amber-900' :
                  existingRequest.status === 'rejected' ? 'text-rose-900' :
                  'text-emerald-900'
                }`}>
                  {existingRequest.status.charAt(0).toUpperCase() + existingRequest.status.slice(1)}
                </p>
                <p className="text-sm text-gray-600">
                  {existingRequest.status === 'pending' ? 'Your verification is being reviewed.' :
                   existingRequest.status === 'rejected' ? 'Your verification was rejected.' :
                   'Your verification was approved!'}
                </p>
                {existingRequest.admin_notes && (
                  <p className="text-xs text-gray-500 mt-1">Admin: {existingRequest.admin_notes}</p>
                )}
              </div>
            </div>
            {existingRequest.status === 'rejected' && (
              <Button
                onClick={() => {
                  setExistingRequest(null);
                  setFormData({ businessName: '', businessDescription: '', businessDocumentUrl: '' });
                }}
                variant="outline"
                className="w-full"
              >
                Submit New Application
              </Button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
            <XCircle className="w-8 h-8 text-gray-400" />
            <div>
              <p className="font-bold text-gray-900">Not Verified</p>
              <p className="text-sm text-gray-600">Apply for verification to build trust with buyers.</p>
            </div>
          </div>
        )}
      </div>

      {/* Verification Application Form */}
      {!isVerified && (!existingRequest || existingRequest.status === 'rejected') && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <FileText className="w-6 h-6 text-gray-600" />
            <h2 className="text-lg font-bold text-gray-900">Apply for Verification</h2>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 rounded-lg text-sm mb-4">{errorMsg}</div>
          )}
          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-lg text-sm mb-4">{successMsg}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600">Business Name</label>
              <Input
                type="text"
                placeholder="Your business or shop name"
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600">Business Description</label>
              <textarea
                placeholder="Describe your business, products, and experience..."
                value={formData.businessDescription}
                onChange={(e) => setFormData({ ...formData, businessDescription: e.target.value })}
                disabled={isSubmitting}
                className="flex w-full rounded-xl border bg-white px-3 py-2 text-sm text-gray-900 transition-all duration-200 placeholder:text-gray-400 focus:outline-hidden focus:ring-2 border-gray-200 hover:border-gray-300 focus:border-emerald-500 focus:ring-emerald-200/50 min-h-[100px]"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600">Business Document (Optional)</label>
              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="https://..."
                  value={formData.businessDocumentUrl}
                  onChange={(e) => setFormData({ ...formData, businessDocumentUrl: e.target.value })}
                  disabled={isSubmitting}
                />
                <label className="flex-1">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleDocumentUpload(file);
                    }}
                    disabled={isSubmitting}
                    className="hidden"
                  />
                  <div className="px-3.5 py-2 rounded-xl bg-gray-50 border border-gray-100 text-xs font-bold text-gray-700 text-center cursor-pointer hover:bg-gray-100 transition-colors flex items-center justify-center gap-2">
                    <Upload className="w-4 h-4" />
                    Upload Document
                  </div>
                </label>
              </div>
              <p className="text-xs text-gray-400">Upload business permit, license, or other verification documents.</p>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-emerald-600 hover:bg-emerald-500"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Application'}
            </Button>
          </form>
        </div>
      )}

      {/* Balance & Payouts Section */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <Wallet className="w-6 h-6 text-emerald-600" />
          <h2 className="text-lg font-bold text-gray-900">Balance & Payouts</h2>
        </div>

        {sellerBalance ? (
          <div className="space-y-6">
            {/* Balance Display */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                <p className="text-xs font-medium text-emerald-600 mb-1">Available Balance</p>
                <p className="text-2xl font-bold text-emerald-900">₱{sellerBalance.available_balance.toFixed(2)}</p>
              </div>
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                <p className="text-xs font-medium text-amber-600 mb-1">Pending Balance</p>
                <p className="text-2xl font-bold text-amber-900">₱{sellerBalance.pending_balance.toFixed(2)}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-xs font-medium text-gray-600 mb-1">Total Earnings</p>
                <p className="text-2xl font-bold text-gray-900">₱{sellerBalance.total_earnings.toFixed(2)}</p>
              </div>
            </div>

            {/* Payout Request Form */}
            <div className="border-t border-gray-100 pt-6">
              <h3 className="text-md font-bold text-gray-900 mb-4">Request Payout</h3>
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 rounded-lg text-sm mb-4">{errorMsg}</div>
              )}
              {successMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-lg text-sm mb-4">{successMsg}</div>
              )}

              <form onSubmit={handlePayoutSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-600">Amount (₱)</label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={payoutForm.amount}
                      onChange={(e) => setPayoutForm({ ...payoutForm, amount: e.target.value })}
                      disabled={isSubmitting}
                      min="0"
                      step="0.01"
                      max={sellerBalance.available_balance}
                      required
                    />
                    <p className="text-xs text-gray-400">Max: ₱{sellerBalance.available_balance.toFixed(2)}</p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-600">Payout Method</label>
                    <select
                      value={payoutForm.payoutMethod}
                      onChange={(e) => setPayoutForm({ ...payoutForm, payoutMethod: e.target.value })}
                      disabled={isSubmitting}
                      className="flex w-full rounded-xl border bg-white px-3 py-2 text-sm text-gray-900 transition-all duration-200 placeholder:text-gray-400 focus:outline-hidden focus:ring-2 border-gray-200 hover:border-gray-300 focus:border-emerald-500 focus:ring-emerald-200/50"
                    >
                      <option value="GCash">GCash</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="PayPal">PayPal</option>
                    </select>
                  </div>
                </div>

                {payoutForm.payoutMethod === 'GCash' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-600">GCash Number</label>
                      <Input
                        type="text"
                        placeholder="09171234567"
                        value={payoutForm.gcashNumber}
                        onChange={(e) => setPayoutForm({ ...payoutForm, gcashNumber: e.target.value })}
                        disabled={isSubmitting}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-600">Account Name</label>
                      <Input
                        type="text"
                        placeholder="Your name"
                        value={payoutForm.accountName}
                        onChange={(e) => setPayoutForm({ ...payoutForm, accountName: e.target.value })}
                        disabled={isSubmitting}
                        required
                      />
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isSubmitting || sellerBalance.available_balance <= 0}
                  className="w-full bg-emerald-600 hover:bg-emerald-500"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {isSubmitting ? 'Submitting...' : 'Request Payout'}
                </Button>
              </form>
            </div>

            {/* Recent Payouts */}
            {recentPayouts.length > 0 && (
              <div className="border-t border-gray-100 pt-6">
                <h3 className="text-md font-bold text-gray-900 mb-4">Recent Payouts</h3>
                <div className="space-y-3">
                  {recentPayouts.map((payout) => (
                    <div
                      key={payout.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100"
                    >
                      <div>
                        <p className="font-bold text-gray-900">₱{payout.amount.toFixed(2)}</p>
                        <p className="text-xs text-gray-500">
                          {payout.payout_method} • {new Date(payout.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                        payout.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                        payout.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                        payout.status === 'failed' ? 'bg-rose-100 text-rose-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Wallet className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No balance information available.</p>
          </div>
        )}
      </div>
    </div>
  );
}
