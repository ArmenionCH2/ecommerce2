'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUserSession } from '@/features/auth/hooks/useUserSession';
import { supabaseClient } from '@/lib/supabase';
import { ArrowLeft, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

const identitySchema = z.object({});

type IdentityData = z.infer<typeof identitySchema>;

export default function SellerApplyIdentityPage() {
  const router = useRouter();
  const { user, isLoading: isSessionLoading } = useUserSession();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [idDocumentFile, setIdDocumentFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [existingRequest, setExistingRequest] = useState<any>(null);

  const {
    register,
    handleSubmit,
  } = useForm<IdentityData>();

  // Route guard: must be logged in as pending_seller AND have existing verification request
  useEffect(() => {
    if (!isSessionLoading) {
      if (!user) {
        router.replace('/seller/apply');
        return;
      }
      if (user.role !== 'pending_seller') {
        router.replace('/seller/apply');
        return;
      }

      checkVerificationStatus();
    }
  }, [user, isSessionLoading]);

  const checkVerificationStatus = async () => {
    if (!user) return;

    const { data: request } = await supabaseClient
      .from('verification_requests')
      .select('*')
      .eq('seller_id', user.id)
      .eq('request_type', 'registration')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!request) {
      // No request exists, send to shop step
      router.replace('/seller/apply/shop');
      return;
    }

    if (request.id_document_url && request.selfie_url) {
      // Already complete, send to pending
      router.replace('/seller/pending');
      return;
    }

    // Load existing request data
    setExistingRequest(request);
  };

  const uploadFile = async (file: File, bucket: string, path: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${path}.${fileExt}`;
    const filePath = `${fileName}`;

    const { data, error } = await supabaseClient.storage
      .from(bucket)
      .upload(filePath, file, {
        upsert: false,
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabaseClient.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const onSubmit = async () => {
    if (!user || !existingRequest) return;

    if (!idDocumentFile) {
      setError('Government ID is required.');
      return;
    }
    if (!selfieFile) {
      setError('Selfie with ID is required.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let idDocumentUrl: string | null = null;
      let selfieUrl: string | null = null;

      // Upload ID document
      if (idDocumentFile) {
        try {
          idDocumentUrl = await uploadFile(
            idDocumentFile,
            'seller-ids',
            `${user.id}/id-doc-${Date.now()}`
          );
        } catch (uploadError) {
          console.error('Upload error:', uploadError);
          setError('Failed to upload government ID. Please try again.');
          setIsLoading(false);
          return;
        }
      }

      // Upload selfie
      if (selfieFile) {
        try {
          selfieUrl = await uploadFile(
            selfieFile,
            'seller-selfies',
            `${user.id}/selfie-${Date.now()}`
          );
        } catch (uploadError) {
          console.error('Upload error:', uploadError);
          setError('Failed to upload selfie. Please try again.');
          setIsLoading(false);
          return;
        }
      }

      // Update existing verification request
      const { error: requestError } = await supabaseClient
        .from('verification_requests')
        .update({
          id_document_url: idDocumentUrl,
          selfie_url: selfieUrl,
          status: 'pending',
        })
        .eq('id', existingRequest.id);

      if (requestError) throw requestError;

      // Redirect to pending page
      router.push('/seller/pending');
    } catch (err) {
      console.error('Identity verification error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSessionLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Become a Seller</h1>
          <p className="text-sm text-gray-500 mt-2">
            Step 3 of 3: Identity Verification
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600">Government ID (Front) *</label>
              <div className="flex items-center gap-3">
                <Input
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  onChange={(e) => {
                    setIdDocumentFile(e.target.files?.[0] || null);
                  }}
                  disabled={isLoading}
                  className="flex-1"
                />
                {idDocumentFile && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
              </div>
              <p className="text-xs text-gray-400">UMID, Driver's License, Passport, etc.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600">Selfie with ID *</label>
              <div className="flex items-center gap-3">
                <Input
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  onChange={(e) => {
                    setSelfieFile(e.target.files?.[0] || null);
                  }}
                  disabled={isLoading}
                  className="flex-1"
                />
                {selfieFile && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
              </div>
              <p className="text-xs text-gray-400">Hold your ID next to your face in the photo.</p>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/seller/apply/shop')}
                disabled={isLoading}
                className="flex-1"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Shop
              </Button>
              <Button type="submit" className="flex-1" disabled={isLoading}>
                {isLoading ? 'Submitting...' : 'Submit Application'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
