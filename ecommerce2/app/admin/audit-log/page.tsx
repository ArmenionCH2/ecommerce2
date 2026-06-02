'use client';

import React, { useEffect, useState } from 'react';
import { useUserSession } from '@/features/auth/hooks/useUserSession';
import { supabaseClient } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, FileText, Search, Shield, User, Clock } from 'lucide-react';
import Link from 'next/link';
import type { AdminAuditLog, Profile } from '@/lib/types';

export default function AdminAuditLogPage() {
  const { user, isLoading: isSessionLoading } = useUserSession();
  const [logs, setLogs] = useState<(AdminAuditLog & { admin: Profile })[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState<string>('all');

  const fetchLogs = async () => {
    try {
      const { data, error } = await supabaseClient
        .from('admin_audit_log')
        .select('*, admin:admin_id(*)')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setLogs((data as any) ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchLogs();
    }
  }, [user]);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.action_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         log.target_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         log.target_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         log.admin?.full_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAction = filterAction === 'all' || log.action_type === filterAction;
    return matchesSearch && matchesAction;
  });

  const actionTypes = Array.from(new Set(logs.map(log => log.action_type)));

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
          Please sign in as a system administrator to view audit logs.
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
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight font-sans">Admin Audit Log</h1>
        <p className="text-sm text-gray-400 mt-1 max-w-2xl">
          Track all administrative actions for security and accountability.
        </p>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-5 border border-gray-100 rounded-2xl shadow-xs">
        <div className="w-full sm:max-w-md relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search by action, target, or admin..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11"
          />
        </div>
        <div className="flex gap-2 items-center">
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-gray-50 border border-gray-100 text-xs font-bold text-gray-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-200/50 focus:border-emerald-500 cursor-pointer"
          >
            <option value="all">All Actions</option>
            {actionTypes.map(action => (
              <option key={action} value={action}>{action}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Audit Logs */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        {filteredLogs.length === 0 ? (
          <p className="text-sm text-gray-500 py-8 text-center bg-gray-50/20">No audit logs found.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredLogs.map((log) => (
              <div key={log.id} className="p-6 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div className="flex items-start gap-4 w-full sm:w-auto">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-900">{log.action_type}</h3>
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-700">
                          {log.target_type}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        by {log.admin?.full_name || 'Unknown admin'} · {new Date(log.created_at).toLocaleString()}
                      </p>
                      {log.target_id && (
                        <p className="text-xs text-gray-400 mt-0.5">Target ID: {log.target_id}</p>
                      )}
                    </div>
                  </div>
                  <Clock className="w-4 h-4 text-gray-400" />
                </div>

                {log.reason && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 font-semibold">Reason:</p>
                    <p className="text-sm text-gray-600 mt-1">{log.reason}</p>
                  </div>
                )}

                {log.old_values && (
                  <div className="bg-rose-50 rounded-lg p-3">
                    <p className="text-xs text-rose-500 font-semibold">Old Values:</p>
                    <div className="text-xs text-rose-600 mt-1 space-y-1">
                      {Object.entries(log.old_values).map(([key, value]) => (
                        <div key={key} className="flex gap-2">
                          <span className="font-semibold">{key}:</span>
                          <span>{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {log.new_values && (
                  <div className="bg-emerald-50 rounded-lg p-3">
                    <p className="text-xs text-emerald-500 font-semibold">New Values:</p>
                    <div className="text-xs text-emerald-600 mt-1 space-y-1">
                      {Object.entries(log.new_values).map(([key, value]) => (
                        <div key={key} className="flex gap-2">
                          <span className="font-semibold">{key}:</span>
                          <span>{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
