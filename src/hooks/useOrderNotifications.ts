import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Order } from '../types';
import { requestNotificationPermission, notifyNewOrder } from '../utils/notifications';

const VIEWED_ORDERS_KEY = 'rca_viewed_orders';
const LAST_CHECK_KEY = 'rca_last_order_check';

export const useOrderNotifications = () => {
  const [newOrderCount, setNewOrderCount] = useState<number>(0);
  const [viewedOrderIds, setViewedOrderIds] = useState<Set<string>>(new Set());
  const [lastCheckTime, setLastCheckTime] = useState<Date | null>(null);

  // Load viewed orders from localStorage and request notification permission
  useEffect(() => {
    const stored = localStorage.getItem(VIEWED_ORDERS_KEY);
    if (stored) {
      try {
        const ids = JSON.parse(stored) as string[];
        setViewedOrderIds(new Set(ids));
      } catch (e) {
        console.error('Error loading viewed orders:', e);
      }
    }

    const lastCheck = localStorage.getItem(LAST_CHECK_KEY);
    if (lastCheck) {
      setLastCheckTime(new Date(lastCheck));
    } else {
      // Set initial check time to now
      const now = new Date();
      setLastCheckTime(now);
      localStorage.setItem(LAST_CHECK_KEY, now.toISOString());
    }

    // Request notification permission on mount
    requestNotificationPermission().catch(err => {
      console.error('Error requesting notification permission:', err);
    });
  }, []);

  // Check for new orders
  const checkNewOrders = useCallback(async () => {
    try {
      if (!lastCheckTime) return;

      const { data: newOrders, error } = await supabase
        .from('orders')
        .select('id, created_at')
        .gte('created_at', lastCheckTime.toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error checking new orders:', error);
        return;
      }

      if (newOrders && newOrders.length > 0) {
        // Filter out already viewed orders
        const unviewedOrders = newOrders.filter(
          order => !viewedOrderIds.has(order.id)
        );
        setNewOrderCount(unviewedOrders.length);
        // Note: Notifications are handled by the real-time subscription for immediate alerts
      } else {
        setNewOrderCount(0);
      }
    } catch (err) {
      console.error('Error in checkNewOrders:', err);
    }
  }, [lastCheckTime, viewedOrderIds]);

  // Set up real-time subscription for new orders
  useEffect(() => {
    const channel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          const newOrder = payload.new as Order;
          // Check if this order is new (not viewed)
          if (!viewedOrderIds.has(newOrder.id)) {
            setNewOrderCount(prev => prev + 1);
            
            // Show browser notification for new order
            const orderNumber = newOrder.id.substring(0, 8);
            notifyNewOrder(orderNumber);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [viewedOrderIds]);

  // Periodically check for new orders (every 30 seconds)
  useEffect(() => {
    checkNewOrders();
    const interval = setInterval(checkNewOrders, 30000);
    return () => clearInterval(interval);
  }, [checkNewOrders]);

  // Mark orders as viewed
  const markOrdersAsViewed = useCallback((orderIds: string[]) => {
    setViewedOrderIds(prev => {
      const newViewed = new Set([...prev, ...orderIds]);
      localStorage.setItem(VIEWED_ORDERS_KEY, JSON.stringify(Array.from(newViewed)));
      return newViewed;
    });
  }, []);

  // Mark all orders as viewed (when admin opens orders page)
  const markAllAsViewed = useCallback(() => {
    const now = new Date();
    setLastCheckTime(now);
    localStorage.setItem(LAST_CHECK_KEY, now.toISOString());
    setNewOrderCount(0);
  }, []);

  // Check if an order is new
  const isNewOrder = useCallback((orderId: string) => {
    return !viewedOrderIds.has(orderId);
  }, [viewedOrderIds]);

  return {
    newOrderCount,
    markOrdersAsViewed,
    markAllAsViewed,
    isNewOrder,
  };
};

