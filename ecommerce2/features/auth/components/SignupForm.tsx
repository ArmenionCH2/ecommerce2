'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { signUp } from '../authClient';

const signupSchema = z.object({
  fullName: z.string().min(2, { message: 'Full name must be at least 2 characters' }),
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

type SignupSchema = z.infer<typeof signupSchema>;

interface SignupFormProps {
  onSuccess?: () => void;
  onToggleForm?: () => void;
}

export function SignupForm({ onSuccess, onToggleForm }: SignupFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupSchema>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupSchema) => {
    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await signUp(data.email, data.password, data.fullName, 'customer');
      if (!res.success) {
        setError(res.error || 'Failed to create account');
        return;
      }
      if (res.needsEmailConfirmation) {
        setSuccessMsg('Account created! Check your email to confirm, then sign in.');
        return;
      }
      onSuccess?.();
      router.push(res.redirectTo);
      router.refresh();
    } catch (err) {
      console.error('Sign up error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-6 sm:p-8 bg-white rounded-2xl shadow-lg border border-gray-100/80">
      <div className="text-center mb-7">
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Create account</h2>
        <p className="text-sm text-gray-500 mt-1.5">
          Create an account to start shopping immediately.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 rounded-lg text-sm">{error}</div>
        )}
        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-lg text-sm">{successMsg}</div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-600">Full name</label>
          <Input type="text" placeholder="Your name" error={!!errors.fullName} disabled={isLoading} {...register('fullName')} />
          {errors.fullName && <p className="text-xs text-rose-500">{errors.fullName.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-600">Email</label>
          <Input type="email" placeholder="you@example.com" error={!!errors.email} disabled={isLoading} {...register('email')} />
          {errors.email && <p className="text-xs text-rose-500">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-600">Password</label>
          <Input type="password" placeholder="••••••••" error={!!errors.password} disabled={isLoading} {...register('password')} />
          {errors.password && <p className="text-xs text-rose-500">{errors.password.message}</p>}
        </div>


        <Button type="submit" className="w-full h-11" disabled={isLoading}>
          {isLoading ? 'Creating account…' : 'Create account'}
        </Button>
      </form>

      {onToggleForm && (
        <p className="mt-5 text-center text-sm text-gray-500">
          Already registered?{' '}
          <button type="button" onClick={onToggleForm} className="text-emerald-600 font-semibold hover:underline">
            Sign in
          </button>
        </p>
      )}

      <div className="mt-4 pt-4 border-t border-gray-100 text-center">
        <p className="text-sm text-gray-500">
          Want to sell?{' '}
          <a href="/seller/apply" className="text-emerald-600 font-semibold hover:underline">
            Apply as a seller →
          </a>
        </p>
      </div>
    </div>
  );
}
