import React, { useState } from 'react';
import { ArrowLeft, Calendar, Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useDateAvailability, AvailableItem } from '../hooks/useDateAvailability';
import { useMenu } from '../hooks/useMenu';

interface DateAvailabilityManagerProps {
  onBack: () => void;
}

const DateAvailabilityManager: React.FC<DateAvailabilityManagerProps> = ({ onBack }) => {
  const { dateAvailabilities, loading, setAvailabilityForDate, deleteAvailabilityForDate, refetch } = useDateAvailability();
  const { menuItems } = useMenu(); // Don't filter by date in admin - show all items
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [selectedAvailableItems, setSelectedAvailableItems] = useState<AvailableItem[]>([]);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [deliveryFees, setDeliveryFees] = useState<Record<string, number>>({});
  const [isSaving, setIsSaving] = useState(false);

  const CITIES = ['Lapu-Lapu City', 'Cebu City', 'Mandaue City', 'Talisay', 'Minglanilla', 'Consolacion', 'Liloan'];

  // Load existing availability for selected date
  React.useEffect(() => {
    const existing = dateAvailabilities.find(da => da.date === selectedDate);
    if (existing) {
      // Use new format if available, otherwise fall back to legacy format
      if (existing.available_items && existing.available_items.length > 0) {
        setSelectedAvailableItems(existing.available_items);
        // Extract unique item IDs for backward compatibility
        const itemIds = [...new Set(existing.available_items.map(item => item.itemId))];
        setSelectedItemIds(itemIds);
      } else {
        // Legacy format - convert to new format
        const legacyItems: AvailableItem[] = existing.available_item_ids.map(itemId => ({
          itemId,
          type: 'base'
        }));
        setSelectedAvailableItems(legacyItems);
        setSelectedItemIds(existing.available_item_ids);
      }
      setDeliveryFees(existing.delivery_fees || {});
    } else {
      setSelectedItemIds([]);
      setSelectedAvailableItems([]);
      setDeliveryFees({});
    }
  }, [selectedDate, dateAvailabilities]);

  const handleToggleItem = (itemId: string) => {
    setSelectedItemIds(prev => 
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
    // Also toggle base item in available items
    setSelectedAvailableItems(prev => {
      const hasBase = prev.some(item => item.itemId === itemId && item.type === 'base');
      if (hasBase) {
        // Remove all entries for this item
        return prev.filter(item => item.itemId !== itemId);
      } else {
        // Add base item
        return [...prev, { itemId, type: 'base' }];
      }
    });
  };

  const handleToggleVariation = (itemId: string, variationId: string) => {
    setSelectedAvailableItems(prev => {
      const exists = prev.some(item => item.itemId === itemId && item.type === 'variation' && item.variationId === variationId);
      if (exists) {
        return prev.filter(item => !(item.itemId === itemId && item.type === 'variation' && item.variationId === variationId));
      } else {
        return [...prev, { itemId, type: 'variation', variationId }];
      }
    });
  };

  const handleToggleAddOn = (itemId: string, addOnId: string) => {
    setSelectedAvailableItems(prev => {
      const exists = prev.some(item => item.itemId === itemId && item.type === 'addon' && item.addOnId === addOnId);
      if (exists) {
        return prev.filter(item => !(item.itemId === itemId && item.type === 'addon' && item.addOnId === addOnId));
      } else {
        return [...prev, { itemId, type: 'addon', addOnId }];
      }
    });
  };

  const toggleExpandItem = (itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const isItemExpanded = (itemId: string) => expandedItems.has(itemId);
  const isBaseSelected = (itemId: string) => selectedAvailableItems.some(item => item.itemId === itemId && item.type === 'base');
  const isVariationSelected = (itemId: string, variationId: string) => 
    selectedAvailableItems.some(item => item.itemId === itemId && item.type === 'variation' && item.variationId === variationId);
  const isAddOnSelected = (itemId: string, addOnId: string) => 
    selectedAvailableItems.some(item => item.itemId === itemId && item.type === 'addon' && item.addOnId === addOnId);

  const handleSelectAll = () => {
    if (selectedItemIds.length === menuItems.length) {
      setSelectedItemIds([]);
    } else {
      setSelectedItemIds(menuItems.map(item => item.id));
    }
  };

  const handleSave = async () => {
    if (!selectedDate) {
      alert('Please select a date');
      return;
    }

    try {
      setIsSaving(true);
      await setAvailabilityForDate(selectedDate, selectedItemIds, deliveryFees, selectedAvailableItems);
      alert('Date availability saved successfully!');
      await refetch();
    } catch (error) {
      alert('Failed to save date availability. Please try again.');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeliveryFeeChange = (city: string, value: string) => {
    const numValue = value === '' ? 0 : parseFloat(value);
    if (isNaN(numValue) || numValue < 0) {
      setDeliveryFees(prev => {
        const updated = { ...prev };
        delete updated[city];
        return updated;
      });
      return;
    }
    setDeliveryFees(prev => ({
      ...prev,
      [city]: numValue
    }));
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete availability settings for ${selectedDate}?`)) {
      return;
    }

    try {
      await deleteAvailabilityForDate(selectedDate);
      setSelectedItemIds([]);
      alert('Date availability deleted successfully!');
      await refetch();
    } catch (error) {
      alert('Failed to delete date availability. Please try again.');
      console.error(error);
    }
  };

  const existingAvailability = dateAvailabilities.find(da => da.date === selectedDate);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="flex items-center space-x-2 text-gray-600 hover:text-black transition-colors duration-200"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back</span>
              </button>
              <h1 className="text-2xl font-playfair font-semibold text-black">Date Availability</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-xl font-playfair font-medium text-black mb-4">Select Date</h2>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-end space-x-2 pt-6">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center space-x-2 disabled:opacity-50"
              >
                <Check className="h-4 w-4" />
                <span>{isSaving ? 'Saving...' : 'Save'}</span>
              </button>
              {existingAvailability && (
                <button
                  onClick={handleDelete}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 flex items-center space-x-2"
                >
                  <X className="h-4 w-4" />
                  <span>Delete</span>
                </button>
              )}
            </div>
          </div>
          {existingAvailability && (
            <p className="mt-2 text-sm text-gray-600">
              {existingAvailability.available_item_ids.length} item(s) currently available on this date
            </p>
          )}
        </div>

        {/* Delivery Fees Section */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-xl font-playfair font-medium text-black mb-4">Delivery Fees (Optional)</h2>
          <p className="text-sm text-gray-600 mb-4">
            Set delivery fees for each city on this date. Leave empty for free delivery. These fees only apply on the selected date.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {CITIES.map(city => (
              <div key={city} className="flex items-center space-x-2">
                <label className="block text-sm font-medium text-gray-700 w-32 flex-shrink-0">
                  {city}:
                </label>
                <div className="flex-1 relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₱</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={deliveryFees[city] || ''}
                    onChange={(e) => handleDeliveryFeeChange(city, e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-playfair font-medium text-black">
              Available Items for {new Date(selectedDate).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </h2>
            <button
              onClick={handleSelectAll}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {selectedItemIds.length === menuItems.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {menuItems.map((item) => {
              const isSelected = isBaseSelected(item.id);
              const hasVariations = item.variations && item.variations.length > 0;
              const hasAddOns = item.addOns && item.addOns.length > 0;
              const isExpanded = isItemExpanded(item.id);
              const showDetails = hasVariations || hasAddOns;

              return (
                <div
                  key={item.id}
                  className={`border-2 rounded-lg transition-all ${
                    isSelected
                      ? 'border-green-600 bg-green-50'
                      : 'border-gray-200'
                  }`}
                >
                  <div 
                    className="p-4 cursor-pointer"
                    onClick={() => handleToggleItem(item.id)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center ${
                        isSelected
                          ? 'border-green-600 bg-green-600'
                          : 'border-gray-300'
                      }`}>
                        {isSelected && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">{item.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">₱{item.basePrice.toFixed(2)}</p>
                        {showDetails && (
                          <p className="text-xs text-gray-400 mt-1">
                            {hasVariations && `${item.variations?.length} variation(s)`}
                            {hasVariations && hasAddOns && ' • '}
                            {hasAddOns && `${item.addOns?.length} add-on(s)`}
                          </p>
                        )}
                      </div>
                      {showDetails && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpandItem(item.id);
                          }}
                          className="flex-shrink-0 text-gray-500 hover:text-gray-700 p-1"
                          title={isExpanded ? "Collapse" : "Expand to see variations and add-ons"}
                        >
                          {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                        </button>
                      )}
                    </div>
                  </div>

                  {isExpanded && showDetails && (
                    <div className="px-4 pb-4 pt-2 border-t border-gray-200 bg-white">
                      {hasVariations && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Variations:</h4>
                          <div className="space-y-2">
                            {item.variations?.map((variation) => {
                              const isVarSelected = isVariationSelected(item.id, variation.id);
                              return (
                                <label
                                  key={variation.id}
                                  className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isVarSelected}
                                    onChange={() => handleToggleVariation(item.id, variation.id)}
                                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                  />
                                  <span className="text-sm text-gray-700">
                                    {variation.name} (+₱{variation.price.toFixed(2)})
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {hasAddOns && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Add-ons:</h4>
                          <div className="space-y-2">
                            {item.addOns?.map((addOn) => {
                              const isAddOnSel = isAddOnSelected(item.id, addOn.id);
                              return (
                                <label
                                  key={addOn.id}
                                  className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isAddOnSel}
                                    onChange={() => handleToggleAddOn(item.id, addOn.id)}
                                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                  />
                                  <span className="text-sm text-gray-700">
                                    {addOn.name} {addOn.price ? `(+₱${addOn.price.toFixed(2)})` : ''}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {menuItems.length === 0 && (
            <p className="text-center text-gray-500 py-8">No menu items available</p>
          )}
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Only items selected for the chosen date will be available for customers to order on that date. 
            Items not selected will be hidden from the menu on that specific date.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DateAvailabilityManager;

