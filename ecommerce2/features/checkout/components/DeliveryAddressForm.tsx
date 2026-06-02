'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle } from 'lucide-react';

const addressSchema = z.object({
  fullName: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  phoneNumber: z.string().regex(/^(09|\+639)\d{9}$/, {
    message: 'Must be a valid PH phone number (e.g. 09171234567 or +639171234567)',
  }),
  address: z.string().min(10, { message: 'Please enter your full detailed address (min 10 characters)' }),
  instructions: z.string().optional(),
});

export type AddressFormData = z.infer<typeof addressSchema>;

interface DeliveryAddressFormProps {
  defaultValues?: Partial<AddressFormData>;
  onSubmit: (data: AddressFormData) => void | Promise<void>;
  isLoading: boolean;
  hasSavedAddress?: boolean;
}

export function DeliveryAddressForm({
  defaultValues,
  onSubmit,
  isLoading,
  hasSavedAddress,
}: DeliveryAddressFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-xs">
      <div>
        <h3 className="text-lg font-bold text-gray-900">Delivery Information</h3>
        <p className="text-xs text-gray-400 mt-1">Please enter your shipping address and phone number for Cash on Delivery.</p>
      </div>

      {hasSavedAddress && (
        <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-full w-fit">
          <CheckCircle className="w-3.5 h-3.5" />
          Using your saved address
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Recipient Name</label>
        <Input
          type="text"
          placeholder="Juan Dela Cruz"
          error={!!errors.fullName}
          disabled={isLoading}
          {...register('fullName')}
        />
        {errors.fullName && (
          <p className="text-xs text-rose-500 font-medium">{errors.fullName.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Contact Number (PH)</label>
        <Input
          type="text"
          placeholder="09171234567"
          error={!!errors.phoneNumber}
          disabled={isLoading}
          {...register('phoneNumber')}
        />
        {errors.phoneNumber && (
          <p className="text-xs text-rose-500 font-medium">{errors.phoneNumber.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Complete Shipping Address</label>
        <textarea
          rows={3}
          placeholder="House Number, Street Name, Barangay, City, Province"
          disabled={isLoading}
          className={`flex w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 transition-all duration-200 placeholder:text-gray-400 focus:outline-hidden focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50 ${
            errors.address
              ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200/50'
              : 'border-gray-200 hover:border-gray-300 focus:border-emerald-500 focus:ring-emerald-200/50'
          }`}
          {...register('address')}
        />
        {errors.address && (
          <p className="text-xs text-rose-500 font-medium">{errors.address.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Rider Instructions (Optional)</label>
        <Input
          type="text"
          placeholder="e.g. Leave at front gate if not answering"
          error={!!errors.instructions}
          disabled={isLoading}
          {...register('instructions')}
        />
      </div>

      <Button type="submit" className="w-full h-11 shadow-xs bg-emerald-600 hover:bg-emerald-500" disabled={isLoading}>
        {isLoading ? 'Processing Order...' : 'Confirm Delivery Details'}
      </Button>
    </form>
  );
}
