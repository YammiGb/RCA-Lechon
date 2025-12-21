import React, { useState } from 'react';
import { ArrowLeft, Calendar, Check, X } from 'lucide-react';
import { useDateAvailability } from '../hooks/useDateAvailability';
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
  const [isSaving, setIsSaving] = useState(false);

  // Load existing availability for selected date
  React.useEffect(() => {
    const existing = dateAvailabilities.find(da => da.date === selectedDate);
    if (existing) {
      setSelectedItemIds(existing.available_item_ids);
    } else {
      setSelectedItemIds([]);
    }
  }, [selectedDate, dateAvailabilities]);

  const handleToggleItem = (itemId: string) => {
    setSelectedItemIds(prev => 
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

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
      await setAvailabilityForDate(selectedDate, selectedItemIds);
      alert('Date availability saved successfully!');
      await refetch();
    } catch (error) {
      alert('Failed to save date availability. Please try again.');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto">
            {menuItems.map((item) => {
              const isSelected = selectedItemIds.includes(item.id);
              return (
                <div
                  key={item.id}
                  onClick={() => handleToggleItem(item.id)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    isSelected
                      ? 'border-green-600 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
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
                    </div>
                  </div>
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

