'use client';

import React, { useEffect, useState } from 'react';
import { useUserSession } from '@/features/auth/hooks/useUserSession';
import { supabaseClient } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Ban, ShieldCheck, Search, UserCheck } from 'lucide-react';
import Link from 'next/link';
import type { Profile } from '@/lib/types';

export default function AdminBansPage() {
  const { user, isLoading: isSessionLoading } = useUserSession();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'banned' | 'active'>('all');
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [banReason, setBanReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabaseClient
        .from('profiles')
        .select('*')
        .neq('role', 'admin')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers((data as Profile[]) ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchUsers();
    }
  }, [user]);

  const handleBan = async () => {
    if (!selectedUser || !banReason.trim()) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabaseClient
        .from('profiles')
        .update({
          is_banned: true,
          ban_reason: banReason,
          banned_at: new Date().toISOString(),
        })
        .eq('id', selectedUser.id);

      if (error) throw error;

      // Write audit log
      if (user) {
        await supabaseClient.from('admin_audit_log').insert({
          admin_id: user.id,
          action_type: 'BAN_USER',
          target_type: 'profile',
          target_id: selectedUser.id,
          new_values: { is_banned: true, ban_reason: banReason },
          reason: banReason || null,
        });
      }

      setSelectedUser(null);
      setBanReason('');
      await fetchUsers();
    } catch (err) {
      console.error('Failed to ban user:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnban = async (userId: string) => {
    try {
      const { error } = await supabaseClient
        .from('profiles')
        .update({
          is_banned: false,
          ban_reason: null,
          banned_at: null,
        })
        .eq('id', userId);

      if (error) throw error;

      // Write audit log
      if (user) {
        await supabaseClient.from('admin_audit_log').insert({
          admin_id: user.id,
          action_type: 'UNBAN_USER',
          target_type: 'profile',
          target_id: userId,
          new_values: { is_banned: false },
        });
      }

      await fetchUsers();
    } catch (err) {
      console.error('Failed to unban user:', err);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || 
                          (filter === 'banned' && user.is_banned) ||
                          (filter === 'active' && !user.is_banned);
    return matchesSearch && matchesFilter;
  });

  if (isSessionLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 max-w-md mx-auto my-10 space-y-4">
        <span className="text-5xl">🔒</span>
        <h3 className="text-xl font-bold text-gray-800">Admin Area Guarded</h3>
        <p className="text-sm text-gray-500 max-w-xs mx-auto">
          Please sign in as a system administrator to manage bans.
        </p>
        <Link href="/admin">
          <Button variant="outline">Back to admin dashboard</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-300">
      <div>
        <Link href="/admin" className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-emerald-600 mb-2 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Platform Overview
        </Link>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight font-sans">User Bans</h1>
        <p className="text-sm text-gray-400 mt-1 max-w-2xl">
          Manage user account bans. Banned users cannot access the platform.
        </p>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-5 border border-gray-100 rounded-2xl shadow-xs">
        <div className="w-full sm:max-w-md relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search users by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(['all', 'banned', 'active'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border cursor-pointer transition-colors ${
                filter === status
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-gray-50 text-gray-700 border-gray-100 hover:bg-gray-100'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)} ({status === 'all' ? users.length : users.filter(u => status === 'banned' ? u.is_banned : !u.is_banned).length})
            </button>
          ))}
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        {filteredUsers.length === 0 ? (
          <p className="text-sm text-gray-500 py-8 text-center bg-gray-50/20">No users found.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredUsers.map((user) => (
              <div key={user.id} className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                      <UserCheck className="w-6 h-6 text-gray-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-900">{user.full_name}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          user.is_banned ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {user.is_banned ? 'Banned' : 'Active'}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-700">
                          {user.role}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Phone: {user.phone_number || 'N/A'} · Address: {user.delivery_address || 'Not provided'}
                      </p>
                      {user.is_banned && user.ban_reason && (
                        <div className="mt-2 bg-rose-50 rounded-lg p-3">
                          <p className="text-xs text-rose-700 font-semibold">Ban Reason:</p>
                          <p className="text-sm text-rose-600 mt-1">{user.ban_reason}</p>
                          <p className="text-xs text-rose-500 mt-1">Banned on: {user.banned_at ? new Date(user.banned_at).toLocaleDateString() : 'N/A'}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {user.is_banned ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUnban(user.id)}
                        className="border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                      >
                        <ShieldCheck className="w-4 h-4 mr-1" />
                        Unban
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedUser(user)}
                        className="border-rose-200 text-rose-600 hover:bg-rose-50"
                      >
                        <Ban className="w-4 h-4 mr-1" />
                        Ban
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ban Dialog */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Ban User</h3>
            <p className="text-sm text-gray-600">
              Are you sure you want to ban <strong>{selectedUser.full_name}</strong>? This will prevent them from accessing the platform.
            </p>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600">Ban Reason (Required)</label>
              <Input
                type="text"
                placeholder="Reason for banning this user..."
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedUser(null);
                  setBanReason('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleBan}
                disabled={!banReason.trim() || isSubmitting}
                className="bg-rose-600 hover:bg-rose-500"
              >
                {isSubmitting ? 'Banning...' : 'Confirm Ban'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
