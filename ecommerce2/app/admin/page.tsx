'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useUserSession } from '@/features/auth/hooks/useUserSession';
import { supabaseClient } from '@/lib/supabase';
import { SystemOverviewCard } from '@/features/admin-control/components/SystemOverviewCard';
import { ModerationRow } from '@/features/admin-control/components/ModerationRow';
import { deactivateProduct } from '@/features/admin-control/actions';
import { Button } from '@/components/ui/button';
import { Users, FileText, ArrowLeft, Ban, Wallet, Shield, Trophy, TrendingUp, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import type { Product } from '@/lib/types';
import { formatPrice } from '@/lib/utils';

export default function AdminDashboardPage() {
  const { user, isLoading: isSessionLoading } = useUserSession();
  const [stats, setStats] = useState({
    totalSales: 0,
    totalSellers: 0,
    totalProducts: 0,
    totalCustomers: 0,
    platformRevenue: 0,
    pendingPayouts: 0,
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPlatformData = useCallback(async () => {
    setLoading(true);
    try {
      // Parallel fetch all independent queries
      const [ordersResult, sellerCountResult, customerCountResult, productCountResult, productsResult, platformRevenueResult, pendingPayoutsResult] = await Promise.all([
        // Use SQL aggregation for sales instead of fetching all orders
        supabaseClient
          .from('orders')
          .select('total_amount')
          .neq('status', 'cancelled'),
        supabaseClient
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'seller'),
        supabaseClient
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'customer'),
        supabaseClient
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true),
        supabaseClient
          .from('products')
          .select('*, profiles:seller_id(full_name)')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(10),
        // Fetch platform revenue from order_fees
        supabaseClient
          .from('order_fees')
          .select('platform_fee'),
        // Fetch pending payouts
        supabaseClient
          .from('seller_payouts')
          .select('amount')
          .eq('status', 'pending'),
      ]);

      const { data: orders, error: oErr } = ordersResult;
      const { count: sellerCount, error: sErr } = sellerCountResult;
      const { count: customerCount, error: cErr } = customerCountResult;
      const { count: productCount, error: pErr } = productCountResult;
      const { data: prodList, error: plErr } = productsResult;
      const { data: fees, error: fErr } = platformRevenueResult;
      const { data: payouts, error: payErr } = pendingPayoutsResult;

      if (oErr) throw oErr;
      if (sErr) throw sErr;
      if (cErr) throw cErr;
      if (pErr) throw pErr;
      if (plErr) throw plErr;
      if (fErr) throw fErr;
      if (payErr) throw payErr;

      const sales = orders?.reduce((sum, o) => sum + Number(o.total_amount), 0) || 0;
      const platformRevenue = fees?.reduce((sum, f) => sum + Number(f.platform_fee), 0) || 0;
      const pendingPayouts = payouts?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      setStats({
        totalSales: sales,
        totalSellers: sellerCount || 0,
        totalProducts: productCount || 0,
        totalCustomers: customerCount || 0,
        platformRevenue,
        pendingPayouts,
      });

      setProducts((prodList as unknown as Product[]) ?? []);

    } catch (err) {
      console.error('Failed to load admin stats', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchPlatformData();
    }
  }, [user, fetchPlatformData]);

  const handleDeactivate = async (productId: number) => {
    const ok = await deactivateProduct(productId, user.id);
    if (ok.success) {
      await fetchPlatformData();
      return true;
    }
    return false;
  };

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
          Please sign in as a system administrator to access the Control Panel.
        </p>
        <Link href="/" passHref legacyBehavior>
          <Button variant="outline" className="gap-1.5">
            <ArrowLeft className="w-4 h-4" />
            Back to marketplace
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-300">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight font-sans">Platform Control Panel</h1>
          <p className="text-sm text-gray-400 mt-1">Monitor platform-wide analytics and audit active crop listings.</p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Link href="/admin/verifications" passHref legacyBehavior>
            <Button variant="outline" className="gap-1.5 border-gray-200 hover:bg-gray-50 text-xs sm:text-sm">
              <Users className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-gray-500" />
              Vendor Vetting
            </Button>
          </Link>
          <Link href="/admin/bans" passHref legacyBehavior>
            <Button variant="outline" className="gap-1.5 border-gray-200 hover:bg-gray-50 text-xs sm:text-sm">
              <Ban className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-gray-500" />
              User Bans
            </Button>
          </Link>
          <Link href="/admin/payouts" passHref legacyBehavior>
            <Button variant="outline" className="gap-1.5 border-gray-200 hover:bg-gray-50 text-xs sm:text-sm">
              <Wallet className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-gray-500" />
              Payouts
            </Button>
          </Link>
          <Link href="/admin/refunds" passHref legacyBehavior>
            <Button variant="outline" className="gap-1.5 border-gray-200 hover:bg-gray-50 text-xs sm:text-sm">
              <RefreshCw className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-gray-500" />
              Refunds
            </Button>
          </Link>
          <Link href="/admin/leaderboard" passHref legacyBehavior>
            <Button variant="outline" className="gap-1.5 border-gray-200 hover:bg-gray-50 text-xs sm:text-sm">
              <Trophy className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-gray-500" />
              Leaderboard
            </Button>
          </Link>
          <Link href="/admin/insights" passHref legacyBehavior>
            <Button variant="outline" className="gap-1.5 border-gray-200 hover:bg-gray-50 text-xs sm:text-sm">
              <TrendingUp className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-gray-500" />
              Insights
            </Button>
          </Link>
          <Link href="/admin/audit-log" passHref legacyBehavior>
            <Button variant="outline" className="gap-1.5 border-gray-200 hover:bg-gray-50 text-xs sm:text-sm">
              <Shield className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-gray-500" />
              Audit Log
            </Button>
          </Link>
          <Link href="/admin/system-logs" passHref legacyBehavior>
            <Button variant="outline" className="gap-1.5 border-gray-200 hover:bg-gray-50 text-xs sm:text-sm">
              <FileText className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-gray-500" />
              System Logs
            </Button>
          </Link>
        </div>
      </div>

      {/* System Stats Overview */}
      <SystemOverviewCard stats={stats} />

      {/* Moderation Panel */}
      <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-xs space-y-4 p-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Listed Products Auditing</h3>
          <p className="text-xs text-gray-400 mt-1">Review active marketplace products. Deactivating a product soft-hides it from buyers.</p>
        </div>

        <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden mt-4">
          {products.length === 0 ? (
            <p className="text-sm text-gray-500 py-8 text-center bg-gray-50/20">No active product listings listed on the platform.</p>
          ) : (
            products.map((product: Product) => (
              <ModerationRow
                key={product.id}
                type="product"
                id={product.id}
                title={product.title}
                subtitle={`Listed by: ${product.profiles?.full_name || 'Unknown seller'}`}
                details={`Price: ${formatPrice(Number(product.price))} | In Stock: ${product.stock_quantity}`}
                isModerated={product.is_active}
                onApprove={async () => true}
                onReject={async () => handleDeactivate(product.id)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
