'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabaseClient } from '@/lib/supabase';
import type { Notification } from '@/lib/types';

export function useNotifications(userId: string | null) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const { data } = await supabaseClient
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);
      setNotifications((data as Notification[]) ?? []);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const markAllRead = useCallback(async () => {
    if (!userId) return;
    await supabaseClient
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    fetchNotifications();

    // Realtime subscription — new notifications appear instantly
    const channel = supabaseClient
      .channel(`notifications_${userId}`)
      .on(
        'postgres_changes',
        {
          event : 'INSERT',
          schema: 'public',
          table : 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setNotifications(prev => [payload.new as Notification, ...prev].slice(0, 20));
        }
      )
      .subscribe();

    return () => { supabaseClient.removeChannel(channel); };
  }, [userId, fetchNotifications]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return { notifications, unreadCount, isLoading, markAllRead };
}
