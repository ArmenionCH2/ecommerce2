'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';

interface FormData {
  // Step 1: Personal Info
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  address: string;
  photoUrl: string;
  photoFile: File | null;

  // Step 2: Store Profile
  storeName: string;
  storeDescription: string;
  storeLogoUrl: string;
  storeLogoFile: File | null;
  storeCoverPhotoUrl: string;
  storeCoverPhotoFile: File | null;
  warehouseAddress: string;
  operatingHours: string;
  preferredCourier: string;
  socialMediaLinks: string;

  // Step 3: Verification & Payouts
  governmentIdUrl: string;
  governmentIdFile: File | null;
  taxIdentificationNumber: string;
  businessRegistrationNumber: string;
  bankName: string;
  bankAccountHolderName: string;
  bankAccountNumber: string;
  billingAddress: string;
  ewalletProvider: string;
  ewalletNumber: string;
}

interface SellerRegistrationFormProps {
  onSubmit: (data: FormData) => Promise<void>;
  isSubmitting: boolean;
}

export function SellerRegistrationForm({ onSubmit, isSubmitting }: SellerRegistrationFormProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    // Step 1
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    address: '',
    photoUrl: '',
    photoFile: null,
    // Step 2
    storeName: '',
    storeDescription: '',
    storeLogoUrl: '',
    storeLogoFile: null,
    storeCoverPhotoUrl: '',
    storeCoverPhotoFile: null,
    warehouseAddress: '',
    operatingHours: '',
    preferredCourier: '',
    socialMediaLinks: '',
    // Step 3
    governmentIdUrl: '',
    governmentIdFile: null,
    taxIdentificationNumber: '',
    businessRegistrationNumber: '',
    bankName: '',
    bankAccountHolderName: '',
    bankAccountNumber: '',
    billingAddress: '',
    ewalletProvider: '',
    ewalletNumber: '',
  });

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>, field: 'photoFile' | 'storeLogoFile' | 'storeCoverPhotoFile' | 'governmentIdFile') => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, [field]: file }));
    }
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }, []);

  const validateStep = useCallback((currentStep: number): boolean => {
    switch (currentStep) {
      case 1:
        return !!(formData.firstName && formData.lastName && formData.email && formData.phoneNumber && formData.address);
      case 2:
        return !!(formData.storeName && formData.warehouseAddress);
      case 3:
        return !!(formData.governmentIdFile || formData.governmentIdUrl);
      default:
        return false;
    }
  }, [formData]);

  const handleNext = useCallback(() => {
    if (validateStep(step)) {
      setStep(prev => prev + 1);
    }
  }, [step, validateStep]);

  const handleBack = useCallback(() => {
    setStep(prev => prev - 1);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (validateStep(step)) {
      await onSubmit(formData);
    }
  }, [step, validateStep, formData, onSubmit]);

  return (
    <div className="space-y-8">
      {/* Progress Steps */}
      <div className="flex items-center justify-between gap-2">
        {[1, 2, 3].map((s) => (
          <React.Fragment key={s}>
            <div className="flex flex-col items-center flex-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                step >= s ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {step > s ? <CheckCircle className="w-5 h-5" /> : s}
              </div>
              <p className={`text-xs mt-2 font-semibold text-center ${step >= s ? 'text-emerald-600' : 'text-gray-400'} hidden sm:block`}>
                {s === 1 ? 'Personal Info' : s === 2 ? 'Store Profile' : 'Verification & Payouts'}
              </p>
            </div>
            {s < 3 && (
              <div className={`flex-1 h-1 mx-2 ${step > s ? 'bg-emerald-600' : 'bg-gray-200'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step 1: Personal Info */}
      {step === 1 && (
        <div className="space-y-6 animate-in fade-in-50 slide-in-from-left-4 duration-300">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Personal Information</h2>
            <p className="text-sm text-gray-500">Tell us about yourself to get started.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700">First Name *</label>
              <Input
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                placeholder="Juan"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700">Last Name *</label>
              <Input
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                placeholder="Dela Cruz"
                className="h-11"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-700">Email Address *</label>
            <Input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="juan@example.com"
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-700">Phone Number *</label>
            <Input
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              placeholder="09123456789"
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-700">Home Address *</label>
            <Input
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              placeholder="123 Main St, Manila"
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-700">Profile Photo</label>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                {formData.photoUrl ? (
                  <img src={formData.photoUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <Upload className="w-8 h-8 text-gray-400" />
                )}
              </div>
              <div className="w-full">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'photoFile')}
                  className="hidden"
                  id="photo-upload"
                />
                <label htmlFor="photo-upload" className="cursor-pointer">
                  <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
                    <span>Upload Photo</span>
                  </Button>
                </label>
                {formData.photoFile && <p className="text-xs text-gray-500 mt-1">{formData.photoFile.name}</p>}
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleNext} className="gap-2 w-full sm:w-auto">
              Next Step <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Store Profile */}
      {step === 2 && (
        <div className="space-y-6 animate-in fade-in-50 slide-in-from-left-4 duration-300">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Store Profile</h2>
            <p className="text-sm text-gray-500">Set up your storefront and operations.</p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-700">Store Name *</label>
            <Input
              name="storeName"
              value={formData.storeName}
              onChange={handleInputChange}
              placeholder="Carlo's Tech Shop"
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-700">Store Description</label>
            <textarea
              name="storeDescription"
              value={formData.storeDescription}
              onChange={handleInputChange}
              placeholder="Tell customers about your store and what you sell..."
              className="w-full h-24 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-200/50 focus:border-emerald-500 resize-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-700">Store Logo</label>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-20 h-20 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                {formData.storeLogoUrl ? (
                  <img src={formData.storeLogoUrl} alt="Store Logo" className="w-full h-full object-cover" />
                ) : (
                  <Upload className="w-8 h-8 text-gray-400" />
                )}
              </div>
              <div className="w-full">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'storeLogoFile')}
                  className="hidden"
                  id="logo-upload"
                />
                <label htmlFor="logo-upload" className="cursor-pointer">
                  <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
                    <span>Upload Logo</span>
                  </Button>
                </label>
                {formData.storeLogoFile && <p className="text-xs text-gray-500 mt-1">{formData.storeLogoFile.name}</p>}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-700">Store Cover Photo</label>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-32 h-20 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                {formData.storeCoverPhotoUrl ? (
                  <img src={formData.storeCoverPhotoUrl} alt="Cover" className="w-full h-full object-cover" />
                ) : (
                  <Upload className="w-8 h-8 text-gray-400" />
                )}
              </div>
              <div className="w-full">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'storeCoverPhotoFile')}
                  className="hidden"
                  id="cover-upload"
                />
                <label htmlFor="cover-upload" className="cursor-pointer">
                  <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
                    <span>Upload Cover</span>
                  </Button>
                </label>
                {formData.storeCoverPhotoFile && <p className="text-xs text-gray-500 mt-1">{formData.storeCoverPhotoFile.name}</p>}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-700">Warehouse/Pickup Address *</label>
            <Input
              name="warehouseAddress"
              value={formData.warehouseAddress}
              onChange={handleInputChange}
              placeholder="Where should couriers pick up orders?"
              className="h-11"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700">Operating Hours</label>
              <Input
                name="operatingHours"
                value={formData.operatingHours}
                onChange={handleInputChange}
                placeholder="9:00 AM - 6:00 PM"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700">Preferred Courier</label>
              <Input
                name="preferredCourier"
                value={formData.preferredCourier}
                onChange={handleInputChange}
                placeholder="J&T, LBC, etc."
                className="h-11"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-700">Social Media Links (optional)</label>
            <Input
              name="socialMediaLinks"
              value={formData.socialMediaLinks}
              onChange={handleInputChange}
              placeholder="Facebook, Instagram URLs"
              className="h-11"
            />
          </div>

          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <Button variant="outline" onClick={handleBack} className="gap-2 w-full sm:w-auto">
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
            <Button onClick={handleNext} className="gap-2 w-full sm:w-auto">
              Next Step <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Verification & Payouts */}
      {step === 3 && (
        <div className="space-y-6 animate-in fade-in-50 slide-in-from-left-4 duration-300">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Verification & Payouts</h2>
            <p className="text-sm text-gray-500">Secure your account and set up payment methods.</p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-700">Government ID *</label>
            <p className="text-xs text-gray-500 mb-2">Upload a valid ID (passport, driver's license, or national ID)</p>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-32 h-20 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                {formData.governmentIdUrl ? (
                  <img src={formData.governmentIdUrl} alt="Government ID" className="w-full h-full object-cover" />
                ) : (
                  <Upload className="w-8 h-8 text-gray-400" />
                )}
              </div>
              <div className="w-full">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'governmentIdFile')}
                  className="hidden"
                  id="id-upload"
                />
                <label htmlFor="id-upload" className="cursor-pointer">
                  <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
                    <span>Upload ID</span>
                  </Button>
                </label>
                {formData.governmentIdFile && <p className="text-xs text-gray-500 mt-1">{formData.governmentIdFile.name}</p>}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700">Tax Identification Number (TIN)</label>
              <Input
                name="taxIdentificationNumber"
                value={formData.taxIdentificationNumber}
                onChange={handleInputChange}
                placeholder="Optional"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700">Business Registration Number</label>
              <Input
                name="businessRegistrationNumber"
                value={formData.businessRegistrationNumber}
                onChange={handleInputChange}
                placeholder="Optional"
                className="h-11"
              />
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-sm font-bold text-gray-900 mb-4">Bank Account Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700">Bank Name</label>
                <Input
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleInputChange}
                  placeholder="BPI, BDO, etc."
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700">Account Holder Name</label>
                <Input
                  name="bankAccountHolderName"
                  value={formData.bankAccountHolderName}
                  onChange={handleInputChange}
                  placeholder="Account holder's full name"
                  className="h-11"
                />
              </div>
            </div>
            <div className="space-y-2 mt-4">
              <label className="text-xs font-bold text-gray-700">Account Number</label>
              <Input
                name="bankAccountNumber"
                value={formData.bankAccountNumber}
                onChange={handleInputChange}
                placeholder="Bank account number"
                className="h-11"
              />
            </div>
            <div className="space-y-2 mt-4">
              <label className="text-xs font-bold text-gray-700">Billing Address (if different)</label>
              <Input
                name="billingAddress"
                value={formData.billingAddress}
                onChange={handleInputChange}
                placeholder="Billing address"
                className="h-11"
              />
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-sm font-bold text-gray-900 mb-4">E-Wallet Details (optional)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700">E-Wallet Provider</label>
                <Input
                  name="ewalletProvider"
                  value={formData.ewalletProvider}
                  onChange={handleInputChange}
                  placeholder="GCash, PayMaya, etc."
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700">E-Wallet Number</label>
                <Input
                  name="ewalletNumber"
                  value={formData.ewalletNumber}
                  onChange={handleInputChange}
                  placeholder="Mobile number"
                  className="h-11"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <Button variant="outline" onClick={handleBack} className="gap-2 w-full sm:w-auto">
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting} className="gap-2 w-full sm:w-auto">
              {isSubmitting ? 'Submitting...' : 'Complete Registration'} <CheckCircle className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
