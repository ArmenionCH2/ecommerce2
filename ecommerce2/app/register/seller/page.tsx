'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseClient } from '@/lib/supabase';
import { SellerRegistrationForm } from '@/features/auth/components/SellerRegistrationForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Store, Shield, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function SellerRegistrationPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const uploadFile = async (file: File, bucket: string, userId: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;
    const filePath = `${bucket}/${fileName}`;

    const { error: uploadError } = await supabaseClient.storage
      .from(bucket)
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabaseClient.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSubmit = async (formData: any) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // First, create the auth user
      const { data: authData, error: authError } = await supabaseClient.auth.signUp({
        email: formData.email,
        password: 'tempPassword123!', // Will be reset via email
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user');

      const userId = authData.user.id;

      // Upload files
      const uploads: Promise<string | null>[] = [];

      if (formData.photoFile) {
        uploads.push(uploadFile(formData.photoFile, 'seller-photos', userId));
      } else {
        uploads.push(Promise.resolve(null));
      }

      if (formData.storeLogoFile) {
        uploads.push(uploadFile(formData.storeLogoFile, 'store-logos', userId));
      } else {
        uploads.push(Promise.resolve(null));
      }

      if (formData.storeCoverPhotoFile) {
        uploads.push(uploadFile(formData.storeCoverPhotoFile, 'store-covers', userId));
      } else {
        uploads.push(Promise.resolve(null));
      }

      if (formData.governmentIdFile) {
        uploads.push(uploadFile(formData.governmentIdFile, 'government-ids', userId));
      } else {
        uploads.push(Promise.resolve(null));
      }

      const [photoUrl, storeLogoUrl, storeCoverPhotoUrl, governmentIdUrl] = await Promise.all(uploads);

      // Create profile with all seller information
      const { error: profileError } = await supabaseClient
        .from('profiles')
        .insert({
          id: userId,
          email: formData.email,
          role: 'seller',
          full_name: `${formData.firstName} ${formData.lastName}`,
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone_number: formData.phoneNumber,
          address: formData.address,
          photo_url: photoUrl,
          store_name: formData.storeName,
          store_description: formData.storeDescription,
          store_logo_url: storeLogoUrl,
          store_cover_photo_url: storeCoverPhotoUrl,
          social_media_links: formData.socialMediaLinks ? JSON.parse(formData.socialMediaLinks) : null,
          government_id_url: governmentIdUrl,
          tax_identification_number: formData.taxIdentificationNumber,
          business_registration_number: formData.businessRegistrationNumber,
          bank_name: formData.bankName,
          bank_account_holder_name: formData.bankAccountHolderName,
          bank_account_number: formData.bankAccountNumber,
          billing_address: formData.billingAddress,
          ewallet_provider: formData.ewalletProvider,
          ewallet_number: formData.ewalletNumber,
          warehouse_address: formData.warehouseAddress,
          operating_hours: formData.operatingHours,
          preferred_courier: formData.preferredCourier,
          registration_status: 'pending', // Requires admin approval
          is_verified: false, // Separate from registration - for blue checkmark
        });

      if (profileError) throw profileError;

      setSuccess(true);
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Failed to complete registration');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 max-w-md w-full p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-900">Registration Submitted!</h1>
            <p className="text-gray-600">
              Your seller account has been created. We'll review your information and send you an email confirmation once your account is verified.
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-gray-500">
              Please check your email to set your password and complete the account setup.
            </p>
            <Link href="/">
              <Button className="w-full bg-gray-900 hover:bg-gray-800">
                Go to Homepage
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 sm:py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-emerald-600 mb-4 sm:mb-6 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to homepage
        </Link>

        <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8 space-y-6 sm:space-y-8">
          <div className="text-center space-y-3 sm:space-y-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-emerald-100 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto">
              <Store className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Seller Registration</h1>
              <p className="text-sm text-gray-500 mt-1 sm:mt-2">
                Join our marketplace and start selling. Complete all steps to verify your account.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
            <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700">
              Your information is secure and will only be used for verification and payout purposes. Government IDs are encrypted and only accessible by administrators.
            </p>
          </div>

          {error && (
            <div className="p-4 bg-rose-50 rounded-xl border border-rose-100">
              <p className="text-sm text-rose-700">{error}</p>
            </div>
          )}

          <SellerRegistrationForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />

          <div className="text-center pt-4 sm:pt-6 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Already have a seller account?{' '}
              <Link href="/login" className="text-emerald-600 font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
