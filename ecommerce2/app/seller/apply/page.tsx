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
import { signUp } from '@/features/auth/authClient';
import { ArrowRight, AlertCircle } from 'lucide-react';

const accountSchema = z.object({
  fullName: z.string().min(2, { message: 'Full name must be at least 2 characters' }),
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  phoneNumber: z.string().min(10, { message: 'Phone number must be at least 10 digits' }),
  deliveryAddress: z.string().min(10, { message: 'Address must be at least 10 characters' }),
});

type AccountData = z.infer<typeof accountSchema>;

export default function SellerApplyPage() {
  const router = useRouter();
  const { user, isLoading: isSessionLoading } = useUserSession();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AccountData>({
    resolver: zodResolver(accountSchema),
  });

  // Route guard: if pending_seller with existing verification request, redirect to appropriate step
  useEffect(() => {
    if (!isSessionLoading && user?.role === 'pending_seller') {
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
      // No request exists, stay on this page (Step 1 already done, but no shop info yet)
      // Actually, if they're already pending_seller, they must have signed up, so send to shop step
      router.replace('/seller/apply/shop');
      return;
    }

    if (!request.id_document_url || !request.selfie_url) {
      router.replace('/seller/apply/identity');
      return;
    }

    // Application complete
    router.replace('/seller/pending');
  };

  const onSubmit = async (data: AccountData) => {
    setIsLoading(true);
    setError(null);

    try {
      // Sign up with pending_seller role
      const authRes = await signUp(
        data.email,
        data.password,
        data.fullName,
        'pending_seller'
      );

      if (!authRes.success) {
        setError(authRes.error || 'Failed to create account');
        setIsLoading(false);
        return;
      }

      // Get the user ID
      const { data: { user: newUser } } = await supabaseClient.auth.getUser();
      if (!newUser) {
        setError('Failed to get user information');
        setIsLoading(false);
        return;
      }

      // Update profile with phone and address
      const { error: profileError } = await supabaseClient
        .from('profiles')
        .update({
          phone_number: data.phoneNumber,
          delivery_address: data.deliveryAddress,
        })
        .eq('id', newUser.id);

      if (profileError) throw profileError;

      // Redirect to shop step
      router.push('/seller/apply/shop');
    } catch (err) {
      console.error('Account creation error:', err);
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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white py-8 sm:py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Become a Seller</h1>
          <p className="text-sm text-gray-500 mt-2">
            Step 1 of 3: Create your account
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8">
          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600">Full Name</label>
              <Input
                type="text"
                placeholder="Juan Dela Cruz"
                error={!!errors.fullName}
                disabled={isLoading}
                {...register('fullName')}
              />
              {errors.fullName && <p className="text-xs text-rose-500">{errors.fullName.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600">Email</label>
              <Input
                type="email"
                placeholder="you@example.com"
                error={!!errors.email}
                disabled={isLoading}
                {...register('email')}
              />
              {errors.email && <p className="text-xs text-rose-500">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600">Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                error={!!errors.password}
                disabled={isLoading}
                {...register('password')}
              />
              {errors.password && <p className="text-xs text-rose-500">{errors.password.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600">Phone Number</label>
              <Input
                type="tel"
                placeholder="09123456789"
                error={!!errors.phoneNumber}
                disabled={isLoading}
                {...register('phoneNumber')}
              />
              {errors.phoneNumber && <p className="text-xs text-rose-500">{errors.phoneNumber.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600">Delivery Address</label>
              <Input
                type="text"
                placeholder="123 Main St, Manila, Philippines"
                error={!!errors.deliveryAddress}
                disabled={isLoading}
                {...register('deliveryAddress')}
              />
              {errors.deliveryAddress && <p className="text-xs text-rose-500">{errors.deliveryAddress.message}</p>}
            </div>

            <Button type="submit" className="w-full h-11 sm:h-12" disabled={isLoading}>
              {isLoading ? 'Creating Account...' : 'Continue to Shop Information'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
