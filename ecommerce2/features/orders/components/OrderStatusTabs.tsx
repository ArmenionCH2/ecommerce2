'use client';

import React, { useState } from 'react';
import type { Order } from '@/lib/types';
import { CourierTrackerCard } from './CourierTrackerCard';

interface OrderStatusTabsProps {
  orders: Order[];
  isLoading: boolean;
  onCancelOrder?: (orderId: number) => void;
  onRefresh?: () => void;
}

export function OrderStatusTabs({ orders, isLoading, onCancelOrder, onRefresh }: OrderStatusTabsProps) {
  const [activeTab, setActiveTab] = useState<'waiting' | 'on_the_way' | 'history'>('waiting');

  const waitingStatuses = ['placed'];
  const onTheWayStatuses = ['to_receive'];
  const historyStatuses = ['received', 'cancelled'];

  const filteredOrders = orders.filter((order) => {
    if (activeTab === 'waiting') {
      return waitingStatuses.includes(order.status);
    } else if (activeTab === 'on_the_way') {
      return onTheWayStatuses.includes(order.status);
    } else {
      return historyStatuses.includes(order.status);
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex border-b border-gray-100">
          <div className="w-32 h-10 bg-gray-100 animate-pulse rounded-t-lg" />
          <div className="w-32 h-10 bg-gray-100 animate-pulse rounded-t-lg ml-2" />
          <div className="w-32 h-10 bg-gray-100 animate-pulse rounded-t-lg ml-2" />
        </div>
        <div className="w-full h-48 bg-gray-50 rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tabs list */}
      <div className="flex border-b border-gray-100">
        <button
          onClick={() => setActiveTab('waiting')}
          className={`pb-3 px-6 text-sm font-bold border-b-2 transition-all duration-200 cursor-pointer ${
            activeTab === 'waiting'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Waiting for Approval
          {orders.filter((o) => waitingStatuses.includes(o.status)).length > 0 && (
            <span className="ml-1.5 px-2 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-700 rounded-full">
              {orders.filter((o) => waitingStatuses.includes(o.status)).length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('on_the_way')}
          className={`pb-3 px-6 text-sm font-bold border-b-2 transition-all duration-200 cursor-pointer ${
            activeTab === 'on_the_way'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          On The Way
          {orders.filter((o) => onTheWayStatuses.includes(o.status)).length > 0 && (
            <span className="ml-1.5 px-2 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-700 rounded-full">
              {orders.filter((o) => onTheWayStatuses.includes(o.status)).length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 px-6 text-sm font-bold border-b-2 transition-all duration-200 cursor-pointer ${
            activeTab === 'history'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          History
        </button>
      </div>

      {/* Orders Grid/List */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-100 max-w-md mx-auto">
          <span className="text-4xl">📦</span>
          <h4 className="font-bold text-gray-800 mt-4">No Orders Found</h4>
          <p className="text-sm text-gray-500 mt-2">
            {activeTab === 'waiting'
              ? "You don't have any orders waiting for approval."
              : activeTab === 'on_the_way'
              ? "You don't have any orders on the way."
              : "You don't have any past order history."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <CourierTrackerCard key={order.id} order={order} onCancelOrder={onCancelOrder} onRefresh={onRefresh} />
          ))}
        </div>
      )}
    </div>
  );
}
