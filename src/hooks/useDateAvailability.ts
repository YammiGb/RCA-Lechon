import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface AvailableItem {
  itemId: string;
  type: 'base' | 'variation' | 'addon';
  variationId?: string;
  addOnId?: string;
}

export interface DateAvailability {
  id: string;
  date: string; // YYYY-MM-DD format
  available_item_ids: string[]; // Legacy format for backward compatibility
  available_items?: AvailableItem[]; // New format with variations/add-ons support
  delivery_fees?: Record<string, number>; // City name -> delivery fee amount
  created_at: string;
  updated_at: string;
}

export const useDateAvailability = () => {
  const [dateAvailabilities, setDateAvailabilities] = useState<DateAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDateAvailabilities = async () => {
    try {
      setLoading(true);
      
      const { data, error: fetchError } = await supabase
        .from('date_availability')
        .select('*')
        .order('date', { ascending: true });

      if (fetchError) throw fetchError;

      // Ensure available_items is parsed if it's a JSON string
      const parsedData = (data || []).map(item => ({
        ...item,
        available_items: typeof item.available_items === 'string' 
          ? JSON.parse(item.available_items) 
          : item.available_items
      }));

      setDateAvailabilities(parsedData);
      setError(null);
    } catch (err) {
      console.error('Error fetching date availabilities:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch date availabilities');
    } finally {
      setLoading(false);
    }
  };

  const getAvailabilityForDate = async (date: string): Promise<string[] | null> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('date_availability')
        .select('available_item_ids')
        .eq('date', date)
        .maybeSingle();

      if (fetchError) {
        // If table doesn't exist or other error, return null (no restrictions)
        console.warn('Error fetching availability for date:', fetchError);
        return null;
      }

      // If no data found, return null (meaning no restrictions)
      if (!data) {
        return null;
      }

      return data.available_item_ids || [];
    } catch (err) {
      console.error('Error fetching availability for date:', err);
      // Return null on any error to allow checkout to proceed
      return null;
    }
  };

  const setAvailabilityForDate = async (
    date: string, 
    availableItemIds: string[], 
    deliveryFees?: Record<string, number>,
    availableItems?: AvailableItem[]
  ) => {
    try {
      const { data, error: upsertError } = await supabase
        .from('date_availability')
        .upsert({
          date,
          available_item_ids: availableItemIds, // Keep for backward compatibility
          available_items: availableItems || availableItemIds.map(itemId => ({ itemId, type: 'base' })),
          delivery_fees: deliveryFees || {}
        }, {
          onConflict: 'date'
        })
        .select()
        .single();

      if (upsertError) throw upsertError;

      await fetchDateAvailabilities();
      return data;
    } catch (err) {
      console.error('Error setting availability for date:', err);
      throw err;
    }
  };

  const getDeliveryFeesForDate = async (date: string): Promise<Record<string, number> | null> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('date_availability')
        .select('delivery_fees')
        .eq('date', date)
        .maybeSingle();

      if (fetchError) {
        console.warn('Error fetching delivery fees for date:', fetchError);
        return null;
      }

      if (!data || !data.delivery_fees) {
        return null;
      }

      return data.delivery_fees as Record<string, number>;
    } catch (err) {
      console.error('Error fetching delivery fees for date:', err);
      return null;
    }
  };

  const deleteAvailabilityForDate = async (date: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('date_availability')
        .delete()
        .eq('date', date);

      if (deleteError) throw deleteError;

      await fetchDateAvailabilities();
    } catch (err) {
      console.error('Error deleting availability for date:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchDateAvailabilities();
  }, []);

  return {
    dateAvailabilities,
    loading,
    error,
    getAvailabilityForDate,
    getDeliveryFeesForDate,
    setAvailabilityForDate,
    deleteAvailabilityForDate,
    refetch: fetchDateAvailabilities
  };
};

