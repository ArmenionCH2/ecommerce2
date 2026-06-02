'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import type { Notification } from '@/lib/types';
import Link from 'next/link';

interface NotificationBellProps {
  userId: string;
}

export function NotificationBell({ userId }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAllRead } = useNotifications(userId);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleOpen = () => {
    setIsOpen(prev => !prev);
    if (!isOpen && unreadCount > 0) {
      markAllRead();
    }
  };

  const typeColors: Record<string, string> = {
    NEW_ORDER          : 'bg-emerald-100 text-emerald-700',
    ORDER_STATUS       : 'bg-blue-100 text-blue-700',
    REFUND_UPDATE      : 'bg-amber-100 text-amber-700',
    PAYOUT_UPDATE      : 'bg-purple-100 text-purple-700',
    NEW_DISPUTE        : 'bg-rose-100 text-rose-700',
    NEW_PAYOUT_REQUEST : 'bg-orange-100 text-orange-700',
    DISPUTE_FILED      : 'bg-rose-100 text-rose-700',
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={handleOpen}
        className="relative p-2.5 text-gray-600 hover:text-emerald-600 hover:bg-gray-50 rounded-full transition-all duration-200"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl border border-gray-100 shadow-lg z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <p className="text-sm font-bold text-gray-900">Notifications</p>
            {notifications.length > 0 && (
              <p className="text-xs text-gray-400">{notifications.length} recent</p>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
            {notifications.length === 0 ? (
              <div className="py-10 text-center">
                <Bell className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  colorClass={typeColors[n.type] ?? 'bg-gray-100 text-gray-600'}
                  onClose={() => setIsOpen(false)}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationItem({
  notification,
  colorClass,
  onClose,
}: {
  notification: Notification;
  colorClass: string;
  onClose: () => void;
}) {
  const content = (
    <div className={`px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer ${!notification.is_read ? 'bg-blue-50/30' : ''}`}>
      <div className="flex items-start gap-3">
        <span className={`mt-0.5 text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${colorClass}`}>
          {notification.type.replace(/_/g, ' ')}
        </span>
        <div className="min-w-0">
          <p className="text-xs font-bold text-gray-900 truncate">{notification.title}</p>
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notification.message}</p>
          <p className="text-[10px] text-gray-400 mt-1">
            {new Date(notification.created_at).toLocaleString('en-PH')}
          </p>
        </div>
        {!notification.is_read && (
          <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1" />
        )}
      </div>
    </div>
  );

  if (notification.link) {
    return (
      <Link href={notification.link} onClick={onClose}>
        {content}
      </Link>
    );
  }

  return content;
}
