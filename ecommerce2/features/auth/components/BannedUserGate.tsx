'use client';

import React from 'react';
import { useUserSession } from '../hooks/useUserSession';
import { AlertCircle, LogOut, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabaseClient } from '@/lib/supabase';

export function BannedUserGate({ children }: { children: React.ReactNode }) {
  const { user, isBanned } = useUserSession();

  const handleSignOut = async () => {
    await supabaseClient.auth.signOut();
  };

  // Check if seller is not verified (registration pending/rejected)
  const isUnverifiedSeller = user?.role === 'seller' && user?.registration_status !== 'approved';

  if (!user || (isBanned || isUnverifiedSeller)) {
    if (isBanned) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 max-w-md w-full p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8 text-rose-600" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-gray-900">Account Banned</h1>
              <p className="text-gray-600">
                Your account has been banned from the platform.
              </p>
            </div>

            {user?.ban_reason && (
              <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 text-left">
                <p className="text-xs font-semibold text-rose-700 mb-1">Reason:</p>
                <p className="text-sm text-rose-600">{user.ban_reason}</p>
                {user.banned_at && (
                  <p className="text-xs text-rose-500 mt-2">
                    Banned on: {new Date(user.banned_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-3">
              <p className="text-sm text-gray-500">
                If you believe this is an error, please contact support.
              </p>
              <Button
                onClick={handleSignOut}
                className="w-full bg-gray-900 hover:bg-gray-800"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      );
    }

    if (isUnverifiedSeller) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 max-w-md w-full p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
              <Clock className="w-8 h-8 text-amber-600" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-gray-900">Account Registration Pending</h1>
              <p className="text-gray-600">
                Your seller account is currently under review by our team.
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-left">
              <p className="text-xs font-semibold text-amber-700 mb-1">What happens next:</p>
              <p className="text-sm text-amber-600">
                Our administrators will review your registration information and government ID. You will receive an email notification once your account is approved.
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-gray-500">
                This process typically takes 1-2 business days.
              </p>
              <Button
                onClick={handleSignOut}
                className="w-full bg-gray-900 hover:bg-gray-800"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return <>{children}</>;
  }

  return <>{children}</>;
}
