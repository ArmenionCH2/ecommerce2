'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { signIn } from '../authClient';

const signinSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

type SigninSchema = z.infer<typeof signinSchema>;

interface SigninFormProps {
  onSuccess?: () => void;
  onToggleForm?: () => void;
}

export function SigninForm({ onSuccess, onToggleForm }: SigninFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SigninSchema>({
    resolver: zodResolver(signinSchema),
  });

  const onSubmit = async (data: SigninSchema) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await signIn(data.email, data.password);
      if (!res.success) {
        setError(res.error || 'Invalid credentials');
        return;
      }
      if (res.needsEmailConfirmation) {
        setError('Please confirm your email before signing in.');
        return;
      }
      onSuccess?.();
      router.push(res.redirectTo);
      router.refresh();
    } catch (err) {
      console.error('Sign in error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-6 sm:p-8 bg-white rounded-2xl shadow-lg border border-gray-100/80">
      <div className="text-center mb-7">
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Welcome back</h2>
        <p className="text-sm text-gray-500 mt-1.5">Sign in to your ACertain account</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 rounded-lg text-sm">
            {error}
          </div>
        )}

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
          {isLoading ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      {onToggleForm && (
        <p className="mt-5 text-center text-sm text-gray-500">
          No account?{' '}
          <button type="button" onClick={onToggleForm} className="text-emerald-600 font-semibold hover:underline">
            Create one
          </button>
        </p>
      )}
    </div>
  );
}
