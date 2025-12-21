import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface DateAvailability {
  id: string;
  date: string; // YYYY-MM-DD format
  available_item_ids: string[];
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

      setDateAvailabilities(data || []);
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
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          // No row found for this date
          return null;
        }
        throw fetchError;
      }

      return data?.available_item_ids || [];
    } catch (err) {
      console.error('Error fetching availability for date:', err);
      return null;
    }
  };

  const setAvailabilityForDate = async (date: string, availableItemIds: string[]) => {
    try {
      const { data, error: upsertError } = await supabase
        .from('date_availability')
        .upsert({
          date,
          available_item_ids: availableItemIds
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
    setAvailabilityForDate,
    deleteAvailabilityForDate,
    refetch: fetchDateAvailabilities
  };
};

