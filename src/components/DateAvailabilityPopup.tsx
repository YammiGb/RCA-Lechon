import React, { useState, useEffect } from 'react';
import { X, Calendar, ShoppingCart } from 'lucide-react';
import { useDateAvailability } from '../hooks/useDateAvailability';
import { useMenu } from '../hooks/useMenu';
import { MenuItem } from '../types';

interface DateAvailabilityPopupProps {
  onItemSelect: (item: MenuItem) => void;
  onClose: () => void;
}

const DateAvailabilityPopup: React.FC<DateAvailabilityPopupProps> = ({ onItemSelect, onClose }) => {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [availableItems, setAvailableItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { dateAvailabilities, loading: availabilityLoading } = useDateAvailability();
  const { menuItems } = useMenu();

  useEffect(() => {
    const checkAndLoadAvailability = async () => {
      try {
        setLoading(true);
        
        // Get today's date
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toISOString().split('T')[0];

        // Find the first available date (today or future)
        const upcomingAvailabilities = dateAvailabilities.filter(avail => {
          const availDate = new Date(avail.date);
          availDate.setHours(0, 0, 0, 0);
          return availDate >= today && avail.available_item_ids && avail.available_item_ids.length > 0;
        }).sort((a, b) => a.date.localeCompare(b.date));

        if (upcomingAvailabilities.length === 0) {
          // No availability set, don't show popup
          setLoading(false);
          onClose();
          return;
        }

        // Get the first upcoming date
        const firstDate = upcomingAvailabilities[0].date;
        const firstDateObj = new Date(firstDate);
        firstDateObj.setHours(0, 0, 0, 0);

        // Check if the date has already passed
        if (firstDateObj < today) {
          // Date has passed, don't show popup
          setLoading(false);
          onClose();
          return;
        }

        // Set the first upcoming date as selected
        setSelectedDate(firstDate);

        // Load available items for this date
        await loadAvailableItems(firstDate, upcomingAvailabilities[0].available_item_ids);
      } catch (error) {
        console.error('Error checking availability:', error);
        setLoading(false);
        onClose();
      } finally {
        setLoading(false);
      }
    };

    if (!availabilityLoading) {
      if (dateAvailabilities.length > 0) {
        checkAndLoadAvailability();
      } else {
        // No availability set, don't show popup
        setLoading(false);
        onClose();
      }
    }
  }, [dateAvailabilities, availabilityLoading, onClose]);

  const loadAvailableItems = async (date: string, availableItemIds: string[]) => {
    try {
      // Filter menu items to only show available ones
      const items = menuItems.filter(item => {
        // Normalize IDs for comparison
        const itemId = String(item.id).toLowerCase().trim();
        return availableItemIds.some(id => String(id).toLowerCase().trim() === itemId);
      });

      setAvailableItems(items);
    } catch (error) {
      console.error('Error loading available items:', error);
      setAvailableItems([]);
    }
  };

  const handleItemClick = (item: MenuItem) => {
    onItemSelect(item);
    onClose();
  };

  const handleClose = () => {
    onClose();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const isToday = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(dateStr);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate.getTime() === today.getTime();
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  if (loading || availabilityLoading || !selectedDate || availableItems.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-rca-green to-green-600">
          <div className="flex items-center space-x-2 text-white">
            <Calendar className="h-5 w-5" />
            <h2 className="text-lg font-semibold">
              {selectedDate && isToday(selectedDate) ? 'Available Today' : 'Available Items'}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-white hover:text-gray-200 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Date Display */}
        <div className="p-4 bg-gray-50 border-b">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Available on:</span> {formatDate(selectedDate)}
          </p>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-4">
          {availableItems.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No items available for this date.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {availableItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-rca-green hover:bg-green-50 transition-all text-left group"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate group-hover:text-rca-green">
                      {item.name}
                    </h3>
                    {item.description && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                    <p className="text-sm font-semibold text-rca-green mt-2">
                      {formatPrice(item.effectivePrice || item.basePrice)}
                    </p>
                  </div>
                  <ShoppingCart className="h-5 w-5 text-gray-400 group-hover:text-rca-green ml-2 flex-shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50">
          <p className="text-xs text-gray-500 text-center">
            Select an item to add it to your cart and proceed to checkout
          </p>
        </div>
      </div>
    </div>
  );
};

export default DateAvailabilityPopup;

