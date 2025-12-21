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

    // Check notification permission status (don't request automatically - requires user interaction)
    console.log('Notification permission status:', Notification.permission);
    console.log('Notification API available:', 'Notification' in window);
    
    if (Notification.permission === 'granted') {
      console.log('Notification permission already granted');
    } else if (Notification.permission === 'default') {
      console.log('Notification permission not yet requested. User needs to interact to grant permission.');
    } else {
      console.log('Notification permission denied by user');
    }
  }, []);

  // Check for new orders
  const checkNewOrders = useCallback(async () => {
    try {
      if (!lastCheckTime) return;

      // Use a more reliable query with error handling
      const { data: newOrders, error } = await supabase
        .from('orders')
        .select('id, created_at, status')
        .gte('created_at', lastCheckTime.toISOString())
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(100); // Limit to prevent large queries

      if (error) {
        console.error('Error checking new orders:', error);
        // Don't throw, just log - real-time subscription will handle new orders
        return;
      }

      if (newOrders && newOrders.length > 0) {
        // Filter out already viewed orders
        const unviewedOrders = newOrders.filter(
          order => !viewedOrderIds.has(order.id)
        );
        
        if (unviewedOrders.length > 0) {
          setNewOrderCount(unviewedOrders.length);
          
          // Fallback: If real-time subscription failed, show notifications via polling
          // Only show notification for the most recent order to avoid spam
          const mostRecentOrder = unviewedOrders[0];
          if (mostRecentOrder && Notification.permission === 'granted') {
            const orderNumber = mostRecentOrder.id.substring(0, 8).toUpperCase();
            console.log('Fallback: Showing notification for order via polling:', orderNumber);
            notifyNewOrder(orderNumber);
          }
        } else {
          setNewOrderCount(0);
        }
      } else {
        setNewOrderCount(0);
      }
    } catch (err) {
      console.error('Error in checkNewOrders:', err);
      // Silently fail - real-time subscription is the primary mechanism
    }
  }, [lastCheckTime, viewedOrderIds]);

  // Set up real-time subscription for new orders
  useEffect(() => {
    console.log('Setting up real-time subscription for orders');
    
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let subscriptionTimeout: NodeJS.Timeout | null = null;
    
    const setupSubscription = () => {
      // Clean up existing subscription if any
      if (channel) {
        supabase.removeChannel(channel);
      }
      
      channel = supabase
        .channel('orders-changes', {
          config: {
            broadcast: { self: true },
            presence: { key: 'admin' }
          }
        })
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'orders'
          },
          (payload) => {
            console.log('New order detected via real-time subscription:', payload);
            const newOrder = payload.new as Order;
            console.log('New order ID:', newOrder.id);
            console.log('New order status:', newOrder.status);
            console.log('Is order already viewed?', viewedOrderIds.has(newOrder.id));
            
            // Only process pending orders
            if (newOrder.status !== 'pending') {
              console.log('Order is not pending, skipping notification');
              return;
            }
            
            // Check if this order is new (not viewed)
            if (!viewedOrderIds.has(newOrder.id)) {
              console.log('Processing new order notification');
              setNewOrderCount(prev => prev + 1);
              
              // Show browser notification for new order
              const orderNumber = newOrder.id.substring(0, 8).toUpperCase();
              console.log('Calling notifyNewOrder with orderNumber:', orderNumber);
              
              // Check notification permission before showing
              if (Notification.permission === 'granted') {
                notifyNewOrder(orderNumber);
              } else {
                console.warn('Notification permission not granted, skipping notification');
              }
            } else {
              console.log('Order already viewed, skipping notification');
            }
          }
        )
        .subscribe((status) => {
          console.log('Subscription status:', status);
          
          // If subscription fails or closes, try to reconnect after a delay
          if (status === 'CHANNEL_ERROR' || status === 'CLOSED' || status === 'TIMED_OUT') {
            console.warn('Subscription error/closed, will retry in 5 seconds...');
            if (subscriptionTimeout) {
              clearTimeout(subscriptionTimeout);
            }
            subscriptionTimeout = setTimeout(() => {
              console.log('Retrying subscription...');
              setupSubscription();
            }, 5000);
          } else if (status === 'SUBSCRIBED') {
            console.log('Successfully subscribed to orders changes');
            // Clear any pending retry
            if (subscriptionTimeout) {
              clearTimeout(subscriptionTimeout);
              subscriptionTimeout = null;
            }
          }
        });
    };
    
    // Initial subscription setup
    setupSubscription();

    return () => {
      console.log('Cleaning up subscription');
      if (subscriptionTimeout) {
        clearTimeout(subscriptionTimeout);
      }
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [viewedOrderIds]);

  // Periodically check for new orders (every 10 seconds as fallback)
  useEffect(() => {
    checkNewOrders();
    const interval = setInterval(checkNewOrders, 10000); // Check every 10 seconds
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

