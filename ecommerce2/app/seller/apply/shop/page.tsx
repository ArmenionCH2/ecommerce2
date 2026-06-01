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
import { TIER_LABELS } from '@/lib/constants';
import { ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

const shopSchema = z.object({
  appliedTier: z.enum(['1', '2', '3'] as const),
  businessName: z.string().min(2, { message: 'Business name must be at least 2 characters' }),
  businessDescription: z.string().min(10, { message: 'Description must be at least 10 characters' }),
});

type ShopData = z.infer<typeof shopSchema>;

export default function SellerApplyShopPage() {
  const router = useRouter();
  const { user, isLoading: isSessionLoading } = useUserSession();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [businessDocumentFile, setBusinessDocumentFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ShopData>({
    resolver: zodResolver(shopSchema),
    defaultValues: { appliedTier: '1' },
  });

  const appliedTier = watch('appliedTier');

  // Route guard: must be logged in as pending_seller
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

      // Check if identity step already complete
      checkIdentityStatus();
    }
  }, [user, isSessionLoading]);

  const checkIdentityStatus = async () => {
    if (!user) return;

    const { data: request } = await supabaseClient
      .from('verification_requests')
      .select('*')
      .eq('seller_id', user.id)
      .eq('request_type', 'registration')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!request) return;

    if (request.id_document_url && request.selfie_url) {
      router.replace('/seller/pending');
      return;
    }

    // Pre-fill the form with existing data
    if (request.business_name) setValue('businessName', request.business_name);
    if (request.business_description) setValue('businessDescription', request.business_description);
    if (request.applied_tier) setValue('appliedTier', String(request.applied_tier) as '1' | '2' | '3');
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

  const onSubmit = async (data: ShopData) => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      let businessDocumentUrl: string | null = null;

      // Upload business document if provided
      if (businessDocumentFile) {
        try {
          businessDocumentUrl = await uploadFile(
            businessDocumentFile,
            'seller-documents',
            `${user.id}/business-doc-${Date.now()}`
          );
        } catch (uploadError) {
          console.error('Upload error:', uploadError);
          setError('Failed to upload business document. Please try again.');
          setIsLoading(false);
          return;
        }
      }

      // Check if a registration request already exists for this seller
      const { data: existingRequest } = await supabaseClient
        .from('verification_requests')
        .select('id')
        .eq('seller_id', user.id)
        .eq('request_type', 'registration')
        .eq('status', 'pending')
        .maybeSingle();

      if (existingRequest) {
        // Update the existing pending row
        const { error: requestError } = await supabaseClient
          .from('verification_requests')
          .update({
            business_name: data.businessName,
            business_description: data.businessDescription,
            business_document_url: businessDocumentUrl,
            applied_tier: parseInt(data.appliedTier),
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingRequest.id);

        if (requestError) throw requestError;
      } else {
        // Insert a fresh row
        const { error: requestError } = await supabaseClient
          .from('verification_requests')
          .insert({
            seller_id: user.id,
            business_name: data.businessName,
            business_description: data.businessDescription,
            business_document_url: businessDocumentUrl,
            applied_tier: parseInt(data.appliedTier),
            request_type: 'registration',
            status: 'pending',
          });

        if (requestError) throw requestError;
      }

      router.push('/seller/apply/identity');
    } catch (err) {
      console.error('Shop information error:', err);
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
            Step 2 of 3: Shop Information
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
              <label className="text-xs font-medium text-gray-600">Seller Type</label>
              <div className="grid grid-cols-1 gap-3">
                {(['1', '2', '3'] as const).map((tier) => (
                  <label
                    key={tier}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                      appliedTier === tier
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      value={tier}
                      {...register('appliedTier')}
                      className="sr-only"
                    />
                    <div className="font-semibold text-gray-900">{TIER_LABELS[parseInt(tier)]}</div>
                  </label>
                ))}
              </div>
              {errors.appliedTier && <p className="text-xs text-rose-500">{errors.appliedTier.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600">Shop/Business Name</label>
              <Input
                type="text"
                placeholder="My Awesome Shop"
                error={!!errors.businessName}
                disabled={isLoading}
                {...register('businessName')}
              />
              {errors.businessName && <p className="text-xs text-rose-500">{errors.businessName.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600">What do you sell?</label>
              <textarea
                placeholder="Describe your products and business..."
                className={`w-full px-3 py-2 rounded-lg border text-sm ${
                  errors.businessDescription ? 'border-rose-300' : 'border-gray-200'
                }`}
                rows={4}
                disabled={isLoading}
                {...register('businessDescription')}
              />
              {errors.businessDescription && <p className="text-xs text-rose-500">{errors.businessDescription.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600">
                Business Document {appliedTier !== '1' && <span className="text-rose-500">*</span>}
              </label>
              <div className="flex items-center gap-3">
                <Input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setBusinessDocumentFile(e.target.files?.[0] || null)}
                  disabled={isLoading}
                  className="flex-1"
                />
                {businessDocumentFile && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
              </div>
              <p className="text-xs text-gray-400">
                DTI, SEC, BIR, or Mayor's Permit. Required for Tier 2 and 3.
              </p>
            </div>

            <Button type="submit" className="w-full h-11" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Continue to Identity Verification'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
