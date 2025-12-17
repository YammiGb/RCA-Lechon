import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Order, OrderItem, CartItem } from '../types';

export const useOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async (status?: Order['status']) => {
    try {
      setLoading(true);
      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setOrders(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const createOrder = async (orderData: {
    customerName: string;
    contactNumber: string;
    contactNumber2?: string;
    serviceType: 'dine-in' | 'pickup' | 'delivery';
    address?: string;
    landmark?: string;
    city?: string;
    pickupDate?: string;
    pickupTime?: string;
    deliveryDate?: string;
    deliveryTime?: string;
    dineInTime?: string;
    paymentMethod: string;
    referenceNumber?: string;
    notes?: string;
    total: number;
    items: CartItem[];
    ipAddress?: string;
  }) => {
    try {
      // Insert order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_name: orderData.customerName,
          contact_number: orderData.contactNumber,
          contact_number2: orderData.contactNumber2 || null,
          service_type: orderData.serviceType,
          address: orderData.address || null,
          landmark: orderData.landmark || null,
          city: orderData.city || null,
          pickup_date: orderData.pickupDate || null,
          pickup_time: orderData.pickupTime || null,
          delivery_date: orderData.deliveryDate || null,
          delivery_time: orderData.deliveryTime || null,
          dine_in_time: orderData.dineInTime || null,
          payment_method: orderData.paymentMethod,
          reference_number: orderData.referenceNumber || null,
          notes: orderData.notes || null,
          total: orderData.total,
          status: 'pending',
          ip_address: orderData.ipAddress || null,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Insert order items
      const orderItems = orderData.items.map(item => ({
        order_id: order.id,
        menu_item_id: item.id.split(':::CART:::')[0] || item.id,
        name: item.name,
        variation: item.selectedVariation || null,
        add_ons: item.selectedAddOns || null,
        unit_price: item.totalPrice,
        quantity: item.quantity,
        subtotal: item.totalPrice * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      return order;
    } catch (err) {
      console.error('Error creating order:', err);
      throw err;
    }
  };

  const updateOrderStatus = async (
    orderId: string,
    status: 'approved' | 'rejected',
    verifiedBy?: string
  ) => {
    try {
      const updateData: any = {
        status,
        verified_at: new Date().toISOString(),
      };

      if (verifiedBy) {
        updateData.verified_by = verifiedBy;
      }

      const { error, data } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId)
        .select(`
          *,
          order_items (*)
        `);

      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.warn('Update succeeded but no data returned. Order may not exist or RLS policy may be blocking.');
        // Still refresh to get latest data
        await fetchOrders();
        return;
      }

      const updatedOrder = data[0];
      console.log('Order updated successfully:', { orderId, status, updatedOrder });

      // Optimistically update the local state immediately with the returned data
      setOrders(prevOrders => {
        const updated = prevOrders.map(order => 
          order.id === orderId ? { ...order, ...updatedOrder } : order
        );
        console.log('Updated orders state:', updated);
        return updated;
      });

      // Then fetch fresh data from server to ensure consistency
      await fetchOrders();
    } catch (err) {
      console.error('Error updating order status:', err);
      throw err;
    }
  };

  const syncOrderToSheets = async (orderId: string, webhookUrl: string) => {
    try {
      // Fetch order with items
      const { data: order, error: fetchError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .eq('id', orderId)
        .single();

      if (fetchError) throw fetchError;

      // Format order data for Google Sheets
      const sheetData = {
        orderId: order.id,
        date: new Date(order.created_at).toLocaleString('en-US', { timeZone: 'Asia/Manila' }),
        customerName: order.customer_name,
        contactNumber: order.contact_number,
        contactNumber2: order.contact_number2 || '',
        serviceType: order.service_type,
        address: order.address || '',
        landmark: order.landmark || '',
        city: order.city || '',
        pickupDate: order.pickup_date || '',
        pickupTime: order.pickup_time || '',
        deliveryDate: order.delivery_date || '',
        deliveryTime: order.delivery_time || '',
        paymentMethod: order.payment_method,
        referenceNumber: order.reference_number || '',
        notes: order.notes || '',
        total: order.total,
        items: (order.order_items || []).map((item: OrderItem) => ({
          name: item.name,
          variation: item.variation ? JSON.stringify(item.variation) : '',
          addOns: item.add_ons ? JSON.stringify(item.add_ons) : '',
          quantity: item.quantity,
          unitPrice: item.unit_price,
          subtotal: item.subtotal,
        })),
      };

      // Call Google Apps Script webhook
      // Using mode: 'no-cors' to avoid CORS issues with Google Apps Script
      // Note: With no-cors, we can't read the response, but the data will still be saved
      const response = await fetch(webhookUrl, {
        method: 'POST',
        mode: 'no-cors', // Required for Google Apps Script to avoid CORS errors
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sheetData),
      });

      // With no-cors mode, response is opaque - we can't check status or read body
      // But the request was sent, so we'll assume success and update the order
      // The user can verify by checking the Google Sheet
      const result = { success: true, message: 'Order synced (response not readable due to CORS)' };

      // Update order as synced
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'synced',
          synced_to_sheets: true,
          synced_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (updateError) throw updateError;

      await fetchOrders();
      return result;
    } catch (err) {
      console.error('Error syncing order to sheets:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return {
    orders,
    loading,
    error,
    fetchOrders,
    createOrder,
    updateOrderStatus,
    syncOrderToSheets,
    refetch: fetchOrders,
  };
};

