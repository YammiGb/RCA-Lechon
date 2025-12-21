import React, { useState, useMemo, useEffect } from 'react';
import { Check, X, RefreshCw, ExternalLink, Calendar, Phone, MapPin, CreditCard, Package, AlertCircle, Copy, Filter, ChevronDown, Search, Edit2, Save, Trash2 } from 'lucide-react';
import { Order } from '../types';
import { useOrders } from '../hooks/useOrders';
import { useOrderNotifications } from '../hooks/useOrderNotifications';

interface OrderVerificationProps {
  webhookUrl?: string;
}

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'danger' | 'warning' | 'info';
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  type = 'danger'
}) => {
  if (!isOpen) return null;

  const colorClasses = {
    danger: {
      button: 'bg-red-600 hover:bg-red-700 text-white',
      icon: 'text-red-600',
      border: 'border-red-200'
    },
    warning: {
      button: 'bg-yellow-600 hover:bg-yellow-700 text-white',
      icon: 'text-yellow-600',
      border: 'border-yellow-200'
    },
    info: {
      button: 'bg-blue-600 hover:bg-blue-700 text-white',
      icon: 'text-blue-600',
      border: 'border-blue-200'
    }
  };

  const colors = colorClasses[type];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full transform transition-all">
        <div className={`p-4 sm:p-6 border-t-4 ${colors.border}`}>
          <div className="flex items-start space-x-3 sm:space-x-4">
            <div className={`flex-shrink-0 ${colors.icon}`}>
              {type === 'danger' && <X className="h-5 w-5 sm:h-6 sm:w-6" />}
              {type === 'warning' && <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6" />}
              {type === 'info' && <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6" />}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">{title}</h3>
              <p className="text-xs sm:text-sm text-gray-600 break-words">{message}</p>
            </div>
          </div>
        </div>
        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 rounded-b-xl flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:space-x-3 sm:gap-0">
          <button
            onClick={onCancel}
            className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${colors.button}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

interface NoteModalProps {
  isOpen: boolean;
  onSave: () => void;
  onCancel: () => void;
  noteValue: string;
  onNoteChange: (value: string) => void;
  isSaving: boolean;
}

const NoteModal: React.FC<NoteModalProps> = ({
  isOpen,
  onSave,
  onCancel,
  noteValue,
  onNoteChange,
  isSaving,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full transform transition-all">
        <div className="p-4 sm:p-6 border-t-4 border-blue-200">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Add Note</h3>
          <textarea
            value={noteValue}
            onChange={(e) => onNoteChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rca-green focus:border-rca-green text-sm mb-4"
            rows={5}
            placeholder="Enter a note for this order..."
            autoFocus
          />
        </div>
        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 rounded-b-xl flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:space-x-3 sm:gap-0">
          <button
            onClick={onCancel}
            disabled={isSaving}
            className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={isSaving}
            className="px-4 py-2.5 text-sm font-medium text-white bg-rca-green rounded-lg hover:bg-rca-green/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  isVisible: boolean;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, isVisible, onClose }) => {
  if (!isVisible) return null;

  const colorClasses = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  };

  const icons = {
    success: <Check className="h-5 w-5" />,
    error: <X className="h-5 w-5" />,
    warning: <AlertCircle className="h-5 w-5" />,
    info: <AlertCircle className="h-5 w-5" />
  };

  return (
    <div className="fixed top-4 right-4 left-4 sm:left-auto z-50 animate-slide-in">
      <div className={`${colorClasses[type]} border-2 rounded-lg p-3 sm:p-4 shadow-lg flex items-center space-x-3 w-full sm:min-w-[300px] sm:max-w-md`}>
        <div className="flex-shrink-0">{icons[type]}</div>
        <p className="flex-1 text-xs sm:text-sm font-medium break-words">{message}</p>
        <button
          onClick={onClose}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

const OrderVerification: React.FC<OrderVerificationProps> = ({ webhookUrl }) => {
  const { orders, loading, fetchOrders, updateOrderStatus, updateOrderNotes, markOrderAsFullyPaid, syncOrderToSheets, deleteOrder } = useOrders();
  const { isNewOrder, markOrdersAsViewed } = useOrderNotifications();
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [refreshKey, setRefreshKey] = useState(0); // Force re-render
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [orderToReject, setOrderToReject] = useState<Order | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteOrderId, setNoteOrderId] = useState<string | null>(null);
  const [noteValue, setNoteValue] = useState<string>('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' | 'info'; isVisible: boolean }>({
    message: '',
    type: 'info',
    isVisible: false
  });

  // Filter states
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all'); // 'all', 'pending', 'approved', 'submitted'
  const [sortByDateProximity, setSortByDateProximity] = useState<boolean>(false);
  const [sortByDateReverse, setSortByDateReverse] = useState<boolean>(false);
  const [showFilterPanel, setShowFilterPanel] = useState<boolean>(false);

  // Extract unique cities from orders with counts
  const availableCities = useMemo(() => {
    const cityCounts = orders.reduce((acc, order) => {
      if (order.city) {
        acc[order.city] = (acc[order.city] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const cities = Object.keys(cityCounts)
      .sort()
      .map(city => ({
        name: city,
        count: cityCounts[city]
      }));

    return cities;
  }, [orders]);

  // Calculate filter counts
  const filterCounts = useMemo(() => {
    const pendingCount = orders.filter(order => order.status === 'pending').length;
    const approvedCount = orders.filter(order => order.status === 'approved' || order.status === 'synced').length;
    // Submitted includes orders with payment_type === 'full-payment'
    const submittedCount = orders.filter(order => order.payment_type === 'full-payment').length;
    return {
      pending: pendingCount,
      approved: approvedCount,
      submitted: submittedCount,
    };
  }, [orders]);

  // Helper function to calculate days remaining or days ago for an order
  const calculateDaysRemaining = (order: Order): { days: number; isPast: boolean } | null => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get the service date for this order
    let serviceDate: Date | null = null;
    if (order.service_type === 'pickup' && order.pickup_date) {
      serviceDate = new Date(order.pickup_date);
    } else if (order.service_type === 'delivery' && order.delivery_date) {
      serviceDate = new Date(order.delivery_date);
    }

    if (!serviceDate) return null;

    serviceDate.setHours(0, 0, 0, 0);

    // Calculate days difference
    const diffTime = serviceDate.getTime() - today.getTime();
    const diffDays = Math.ceil(Math.abs(diffTime) / (1000 * 60 * 60 * 24));

    // Check if it's in the past
    const isPast = serviceDate.getTime() < today.getTime();

    return { days: diffDays, isPast };
  };

  // Apply filters to orders
  const filteredOrders = useMemo(() => {
    let filtered = [...orders];

    // Filter by search term (order number)
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(order => {
        const orderNumber = order.id.substring(0, 8).toLowerCase();
        return orderNumber.includes(searchLower);
      });
    }

    // Filter by city
    if (selectedCity !== 'all') {
      filtered = filtered.filter(order => order.city === selectedCity);
    }

    // Filter by date
    if (selectedDate) {
      const filterDate = new Date(selectedDate);
      filterDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.created_at);
        orderDate.setHours(0, 0, 0, 0);
        return orderDate.getTime() === filterDate.getTime();
      });
    }

    // Filter by status
    if (statusFilter === 'pending') {
      filtered = filtered.filter(order => order.status === 'pending');
    } else if (statusFilter === 'approved') {
      filtered = filtered.filter(order => order.status === 'approved' || order.status === 'synced');
    } else if (statusFilter === 'submitted') {
      filtered = filtered.filter(order => order.payment_type === 'full-payment');
    }
    // 'all' means no filtering

    // Sort by date proximity to today (closer dates first)
    // Uses the delivery/pickup date chosen by the customer, not the order creation date
    // Excludes orders where the delivery/pickup date has already passed
    if (sortByDateProximity) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Helper function to get the service date chosen by the customer
      const getServiceDate = (order: Order): Date | null => {
        if (order.service_type === 'pickup' && order.pickup_date) {
          return new Date(order.pickup_date);
        } else if (order.service_type === 'delivery' && order.delivery_date) {
          return new Date(order.delivery_date);
        }
        // Return null if no service date exists
        return null;
      };

      // Filter out orders with past dates
      filtered = filtered.filter(order => {
        const serviceDate = getServiceDate(order);
        if (!serviceDate) {
          // If no service date, exclude the order
          return false;
        }
        serviceDate.setHours(0, 0, 0, 0);
        // Only include orders where the service date is today or in the future
        return serviceDate.getTime() >= today.getTime();
      });

      // Sort by date proximity (closer dates first)
      filtered.sort((a, b) => {
        const dateA = getServiceDate(a)!;
        const dateB = getServiceDate(b)!;
        
        dateA.setHours(0, 0, 0, 0);
        dateB.setHours(0, 0, 0, 0);

        // Calculate absolute difference from today
        const diffA = Math.abs(dateA.getTime() - today.getTime());
        const diffB = Math.abs(dateB.getTime() - today.getTime());

        // Sort by proximity (smaller difference = closer to today = appears first)
        return diffA - diffB;
      });
    }

    // Sort by date reverse (longer dates first, closer dates at bottom)
    // Uses the delivery/pickup date chosen by the customer, not the order creation date
    // Excludes orders where the delivery/pickup date has already passed
    if (sortByDateReverse) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Helper function to get the service date chosen by the customer
      const getServiceDate = (order: Order): Date | null => {
        if (order.service_type === 'pickup' && order.pickup_date) {
          return new Date(order.pickup_date);
        } else if (order.service_type === 'delivery' && order.delivery_date) {
          return new Date(order.delivery_date);
        }
        // Return null if no service date exists
        return null;
      };

      // Filter out orders with past dates
      filtered = filtered.filter(order => {
        const serviceDate = getServiceDate(order);
        if (!serviceDate) {
          // If no service date, exclude the order
          return false;
        }
        serviceDate.setHours(0, 0, 0, 0);
        // Only include orders where the service date is today or in the future
        return serviceDate.getTime() >= today.getTime();
      });

      // Sort by date reverse (longer dates first, closer dates at bottom)
      filtered.sort((a, b) => {
        const dateA = getServiceDate(a)!;
        const dateB = getServiceDate(b)!;
        
        dateA.setHours(0, 0, 0, 0);
        dateB.setHours(0, 0, 0, 0);

        // Calculate absolute difference from today
        const diffA = Math.abs(dateA.getTime() - today.getTime());
        const diffB = Math.abs(dateB.getTime() - today.getTime());

        // Sort by reverse proximity (larger difference = further from today = appears first)
        return diffB - diffA;
      });
    }

    return filtered;
  }, [orders, searchTerm, selectedCity, selectedDate, statusFilter, sortByDateProximity, sortByDateReverse]);

  // Mark orders as viewed when component mounts or orders change
  useEffect(() => {
    if (orders.length > 0) {
      const orderIds = orders.map(order => order.id);
      markOrdersAsViewed(orderIds);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders.length]);

  // Use useMemo to ensure filtering happens with latest data
  const pendingOrders = useMemo(() => 
    filteredOrders.filter(order => order.status === 'pending'), 
    [filteredOrders, refreshKey]
  );
  const approvedOrders = useMemo(() => 
    filteredOrders.filter(order => order.status === 'approved'), 
    [filteredOrders, refreshKey]
  );
  const syncedOrders = useMemo(() => 
    filteredOrders.filter(order => order.status === 'synced'), 
    [filteredOrders, refreshKey]
  );

  const handleApprove = async (order: Order) => {
    try {
      setProcessingOrderId(order.id);
      
      // Update status in database
      await updateOrderStatus(order.id, 'approved', 'admin');
      
      // Force UI refresh
      setRefreshKey(prev => prev + 1);
      await fetchOrders();
      
      // If webhook URL is provided, sync to Google Sheets
      if (webhookUrl) {
        try {
          await syncOrderToSheets(order.id, webhookUrl);
          // Refresh again after syncing
          setRefreshKey(prev => prev + 1);
          await fetchOrders();
          showToast('Order approved and synced to Google Sheets successfully!', 'success');
        } catch (syncError) {
          console.error('Failed to sync to Google Sheets:', syncError);
          showToast('Order approved but failed to sync to Google Sheets. Please sync manually.', 'warning');
          // Still refresh to show approved status
          setRefreshKey(prev => prev + 1);
          await fetchOrders();
        }
      } else {
        showToast('Order approved successfully!', 'success');
      }
    } catch (error) {
      console.error('Error approving order:', error);
      showToast('Failed to approve order. Please try again.', 'error');
      // Refresh on error to ensure UI is in sync
      setRefreshKey(prev => prev + 1);
      await fetchOrders();
    } finally {
      setProcessingOrderId(null);
    }
  };

  const handleRejectClick = (order: Order) => {
    setOrderToReject(order);
    setShowRejectModal(true);
  };

  const handleRejectConfirm = async () => {
    if (!orderToReject) return;

    try {
      setProcessingOrderId(orderToReject.id);
      setShowRejectModal(false);
      await updateOrderStatus(orderToReject.id, 'rejected', 'admin');
      
      // Force UI refresh
      setRefreshKey(prev => prev + 1);
      await fetchOrders();
      showToast('Order rejected successfully', 'success');
    } catch (error) {
      console.error('Error rejecting order:', error);
      showToast('Failed to reject order. Please try again.', 'error');
      // Refresh on error to ensure UI is in sync
      setRefreshKey(prev => prev + 1);
      await fetchOrders();
    } finally {
      setProcessingOrderId(null);
      setOrderToReject(null);
    }
  };

  const handleDeleteClick = (order: Order) => {
    setOrderToDelete(order);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!orderToDelete) return;

    try {
      setProcessingOrderId(orderToDelete.id);
      setShowDeleteModal(false);
      await deleteOrder(orderToDelete.id);
      
      // Force UI refresh
      setRefreshKey(prev => prev + 1);
      await fetchOrders();
      showToast('Order deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting order:', error);
      showToast('Failed to delete order. Please try again.', 'error');
      // Refresh on error to ensure UI is in sync
      setRefreshKey(prev => prev + 1);
      await fetchOrders();
    } finally {
      setProcessingOrderId(null);
      setOrderToDelete(null);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setToast({ message, type, isVisible: true });
    setTimeout(() => {
      setToast(prev => ({ ...prev, isVisible: false }));
    }, 5000);
  };

  const handleMarkAsFullyPaid = async (order: Order) => {
    try {
      setProcessingOrderId(order.id);
      await markOrderAsFullyPaid(order.id);
      showToast('Order marked as submitted!', 'success');
      setRefreshKey(prev => prev + 1);
      await fetchOrders();
    } catch (error) {
      console.error('Error marking order as fully paid:', error);
      showToast('Failed to mark order as submitted. Please try again.', 'error');
    } finally {
      setProcessingOrderId(null);
    }
  };

  const handleSyncToSheets = async (order: Order) => {
    if (!webhookUrl) {
      showToast('Google Sheets webhook URL is not configured. Please set it up first.', 'warning');
      return;
    }

    try {
      setProcessingOrderId(order.id);
      await syncOrderToSheets(order.id, webhookUrl);
      showToast('Order synced to Google Sheets successfully!', 'success');
      await fetchOrders();
    } catch (error) {
      console.error('Error syncing to sheets:', error);
      showToast('Failed to sync to Google Sheets. Please check the webhook URL and try again.', 'error');
    } finally {
      setProcessingOrderId(null);
    }
  };

  const handleOpenNoteModal = (order: Order) => {
    setNoteOrderId(order.id);
    setNoteValue(order.notes || '');
    setShowNoteModal(true);
  };

  const handleSaveNote = async () => {
    if (!noteOrderId) return;
    
    try {
      setProcessingOrderId(noteOrderId);
      await updateOrderNotes(noteOrderId, noteValue);
      setShowNoteModal(false);
      setNoteOrderId(null);
      setNoteValue('');
      showToast('Note saved successfully!', 'success');
      setRefreshKey(prev => prev + 1);
      await fetchOrders();
    } catch (error) {
      console.error('Error saving note:', error);
      showToast('Failed to save note. Please try again.', 'error');
    } finally {
      setProcessingOrderId(null);
    }
  };

  const handleCloseNoteModal = () => {
    setShowNoteModal(false);
    setNoteOrderId(null);
    setNoteValue('');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      timeZone: 'Asia/Manila',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (price: number) => {
    return `₱${price.toFixed(2)}`;
  };

  const formatOrderDetails = (order: Order): string => {
    const parts: string[] = [];
    
    // Add order number at the beginning
    const orderNumber = order.id.substring(0, 8);
    parts.push(`Order #${orderNumber}`);
    parts.push(''); // Empty line after order number
    
    // Format number with commas
    const formatPrice = (price: number) => {
      return price.toLocaleString('en-US');
    };

    // Format contact number with dashes (e.g., 0935-257-5468)
    const formatContactNumber = (number: string) => {
      const cleaned = number.replace(/[-\s]/g, '');
      if (cleaned.length === 11) {
        return `${cleaned.substring(0, 4)}-${cleaned.substring(4, 7)}-${cleaned.substring(7)}`;
      }
      return number;
    };

    // Format date and time
    let dateTimeStr = '';
    if (order.service_type === 'pickup' && order.pickup_date && order.pickup_time) {
      const pickupDate = new Date(order.pickup_date);
      const timeStr = order.pickup_time;
      const [hours, minutes] = timeStr.split(':').map(Number);
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHour = hours % 12 || 12;
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      dateTimeStr = `${monthNames[pickupDate.getMonth()]} ${pickupDate.getDate()}, ${pickupDate.getFullYear()}         ${displayHour}:${minutes.toString().padStart(2, '0')}${ampm}`;
    } else if (order.service_type === 'delivery' && order.delivery_date && order.delivery_time) {
      const deliveryDate = new Date(order.delivery_date);
      const timeStr = order.delivery_time;
      const [hours, minutes] = timeStr.split(':').map(Number);
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHour = hours % 12 || 12;
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      dateTimeStr = `${monthNames[deliveryDate.getMonth()]} ${deliveryDate.getDate()}, ${deliveryDate.getFullYear()}         ${displayHour}:${minutes.toString().padStart(2, '0')}${ampm}`;
    }
    if (dateTimeStr) {
      parts.push(dateTimeStr);
      parts.push(''); // Empty line after date/time
    }
    
    // Address (keep original case)
    if (order.address) {
      parts.push(order.address);
    }
    
    // Landmark (keep original case, before city)
    if (order.landmark) {
      parts.push(order.landmark);
    }
    
    // City (keep original case)
    if (order.city) {
      parts.push(order.city);
    }
    
    // Empty line after address section
    parts.push('');
    
    // Customer name
    parts.push(order.customer_name);
    
    // Contact numbers (formatted with dashes, one per line)
    parts.push(formatContactNumber(order.contact_number));
    if (order.contact_number2) {
      parts.push(formatContactNumber(order.contact_number2));
    }
    
    // Empty line after customer info
    parts.push('');
    
    // Items: price with commas first, then name
    if (order.order_items && order.order_items.length > 0) {
      order.order_items.forEach(item => {
        const itemPrice = Math.round(item.subtotal);
        parts.push(`${formatPrice(itemPrice)} ${item.name}`);
      });
    }
    
    // Empty line after items
    parts.push('');
    
    // Payment info: total price and payment method
    const totalPrice = Math.round(order.total);
    
    // Determine payment method display
    let paymentMethodDisplay = order.payment_method.toUpperCase();
    if (order.service_type === 'delivery') {
      if (order.payment_method === 'cod') {
        paymentMethodDisplay = 'COD';
      } else if (order.payment_method === 'gcash' || order.payment_method === 'gcash-on-delivery') {
        paymentMethodDisplay = 'GCash on Delivery';
      }
    }
    
    // Format payment info based on payment type
    if (order.payment_type === 'down-payment' && order.down_payment_amount) {
      const downPayment = Math.round(order.down_payment_amount);
      const remainingBalance = totalPrice - downPayment;
      parts.push(`${formatPrice(totalPrice)}-${formatPrice(downPayment)} DP`);
      parts.push(`${formatPrice(remainingBalance)} Bal. ${paymentMethodDisplay}`);
    } else {
      parts.push(`${formatPrice(totalPrice)} ${paymentMethodDisplay}`);
    }
    
    // Add note if exists
    if (order.notes) {
      parts.push('');
      parts.push('Note:');
      parts.push(order.notes);
    }
    
    return parts.join('\n');
  };

  const handleCopyOrderNumber = async (orderId: string) => {
    const orderNumber = orderId.substring(0, 8);
    try {
      await navigator.clipboard.writeText(orderNumber);
      showToast('Order number copied!', 'success');
    } catch (err) {
      console.error('Failed to copy:', err);
      showToast('Failed to copy order number', 'error');
    }
  };

  const handleCopyOrderDetails = async (order: Order) => {
    const orderDetails = formatOrderDetails(order);
    try {
      await navigator.clipboard.writeText(orderDetails);
      showToast('Order details copied!', 'success');
    } catch (err) {
      console.error('Failed to copy:', err);
      showToast('Failed to copy order details', 'error');
    }
  };

  const OrderCard = ({ order }: { order: Order }) => {
    const isProcessing = processingOrderId === order.id;
    const canSync = order.status === 'approved' && !order.synced_to_sheets && webhookUrl;
    const daysInfo = calculateDaysRemaining(order);

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                Order #{order.id.substring(0, 8)}
              </h3>
              {isNewOrder(order.id) && (
                <span className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0" title="New order"></span>
              )}
              <button
                onClick={() => handleCopyOrderNumber(order.id)}
                className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                title="Copy order number"
              >
                <Copy className="h-4 w-4" />
              </button>
              {daysInfo !== null && (
                <div className={`inline-flex items-center px-2 py-1 rounded-lg border text-xs font-medium flex-shrink-0 ${
                  daysInfo.isPast 
                    ? 'bg-gray-100 text-gray-700 border-gray-200' 
                    : 'bg-blue-100 text-blue-800 border-blue-200'
                }`}>
                  <Calendar className="h-3 w-3 mr-1" />
                  <span>
                    {daysInfo.days === 0 
                      ? 'Today' 
                      : daysInfo.isPast
                      ? daysInfo.days === 1
                        ? '1 day ago'
                        : `${daysInfo.days} days ago`
                      : daysInfo.days === 1 
                      ? '1 day remaining' 
                      : `${daysInfo.days} days remaining`}
                  </span>
                </div>
              )}
            </div>
            <p className="text-xs sm:text-sm text-gray-500">
              {formatDate(order.created_at)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
            <button
              onClick={() => handleCopyOrderDetails(order)}
              className="px-2 sm:px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-1 flex-shrink-0"
              title="Copy order details"
            >
              <Copy className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Copy Details</span>
            </button>
            <button
              onClick={() => handleOpenNoteModal(order)}
              className="px-2 sm:px-3 py-1.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center space-x-1 flex-shrink-0"
              title="Add or edit note"
            >
              <Edit2 className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Add Note</span>
            </button>
            <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
              order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              order.status === 'approved' ? 'bg-blue-100 text-blue-800' :
              order.status === 'synced' ? 'bg-green-100 text-green-800' :
              'bg-red-100 text-red-800'
            }`}>
              {order.status.toUpperCase()}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm sm:text-base">
              <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 flex-shrink-0" />
              <span className="font-medium break-words">{order.customer_name}</span>
            </div>
            <div className="flex items-start space-x-2 text-xs sm:text-sm text-gray-600">
              <Phone className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="flex flex-col sm:flex-row sm:gap-1 break-all">
                <span>{order.contact_number}</span>
                {order.contact_number2 && <span className="sm:before:content-['/'] sm:before:mx-1">{order.contact_number2}</span>}
              </div>
            </div>
            {order.address && (
              <div className="flex items-start space-x-2 text-xs sm:text-sm text-gray-600">
                <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 break-words">
                  <span>{order.address}</span>
                  {order.landmark && <span>, {order.landmark}</span>}
                </div>
              </div>
            )}
            {order.city && (
              <div className="text-xs sm:text-sm text-gray-600 ml-6 sm:ml-6">{order.city}</div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm sm:text-base">
              <Package className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 flex-shrink-0" />
              <span className="font-medium capitalize">{order.service_type}</span>
            </div>
            {(order.pickup_date || order.delivery_date) && (
              <div className="flex items-start space-x-2 text-xs sm:text-sm text-gray-600">
                <Calendar className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <span className="break-words">
                  {order.service_type === 'pickup' 
                    ? `${order.pickup_date} at ${order.pickup_time}`
                    : order.service_type === 'delivery'
                    ? `${order.delivery_date} at ${order.delivery_time}`
                    : 'N/A'
                  }
                </span>
              </div>
            )}
            <div className="flex items-start space-x-2 text-xs sm:text-sm">
              <CreditCard className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 break-words">
                <span className="font-medium">{order.payment_method}</span>
                {order.payment_type && (
                  <span className="text-gray-600">
                    {' '}({order.payment_type === 'down-payment' ? 'Down Payment' : 'Full Payment'})
                    {order.payment_type === 'down-payment' && order.down_payment_amount && (
                      <span className="ml-1">- ₱{order.down_payment_amount.toFixed(2)}</span>
                    )}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Note Display */}
        {order.notes && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <span className="text-sm font-medium text-blue-900">Note:</span>
              <p className="text-sm text-blue-800 whitespace-pre-wrap flex-1">{order.notes}</p>
            </div>
          </div>
        )}

        {/* Order Items */}
        {order.order_items && order.order_items.length > 0 && (
          <div className="mb-4">
            <h4 className="font-medium text-gray-900 mb-2">Items:</h4>
            <div className="space-y-1">
              {order.order_items.map((item) => {
                // Safely parse variation
                let variationName = null;
                if (item.variation) {
                  try {
                    const variation = typeof item.variation === 'string' 
                      ? JSON.parse(item.variation) 
                      : item.variation;
                    variationName = variation?.name || 'Variation';
                  } catch (e) {
                    console.warn('Failed to parse variation:', e);
                    variationName = 'Variation';
                  }
                }

                // Safely parse add_ons
                let addOnsList: any[] = [];
                if (item.add_ons) {
                  try {
                    if (typeof item.add_ons === 'string') {
                      addOnsList = JSON.parse(item.add_ons);
                    } else if (Array.isArray(item.add_ons)) {
                      addOnsList = item.add_ons;
                    }
                  } catch (e) {
                    console.warn('Failed to parse add_ons:', e);
                    addOnsList = [];
                  }
                }

                return (
                  <div key={item.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs sm:text-sm bg-gray-50 p-2 sm:p-3 rounded gap-1 sm:gap-0">
                    <div className="flex-1 min-w-0">
                      <span className="font-medium break-words">{item.name}</span>
                      {variationName && (
                        <span className="text-gray-600"> - {variationName}</span>
                      )}
                      {addOnsList.length > 0 && (
                        <span className="text-gray-600">
                          {' + '}
                          {addOnsList.map((addOn: any) => addOn.name).join(', ')}
                        </span>
                      )}
                      <span className="text-gray-600"> x{item.quantity}</span>
                    </div>
                    <span className="font-medium text-right sm:text-left">{formatPrice(item.subtotal)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-4 border-t border-gray-200 gap-3">
          <div className="text-base sm:text-lg font-semibold text-gray-900">
            Total: <span className="text-green-600">{formatPrice(order.total)}</span>
          </div>
          <div className="flex flex-row items-center gap-2 flex-wrap">
            {order.status === 'pending' && (
              <>
                <button
                  onClick={() => handleRejectClick(order)}
                  disabled={isProcessing}
                  className="px-3 sm:px-4 py-2 sm:py-2.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-1 sm:space-x-2 text-xs sm:text-sm"
                >
                  <X className="h-4 w-4" />
                  <span>Reject</span>
                </button>
                <button
                  onClick={() => handleApprove(order)}
                  disabled={isProcessing}
                  className="px-3 sm:px-4 py-2 sm:py-2.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-1 sm:space-x-2 text-xs sm:text-sm"
                >
                  {isProcessing ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  <span>Approve</span>
                </button>
              </>
            )}
            {order.payment_type === 'down-payment' && order.status !== 'pending' && (
              <button
                onClick={() => handleMarkAsFullyPaid(order)}
                disabled={isProcessing}
                className="px-3 sm:px-4 py-2 sm:py-2.5 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-1 sm:space-x-2 text-xs sm:text-sm"
              >
                {isProcessing ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <CreditCard className="h-4 w-4" />
                )}
                <span>Submit</span>
              </button>
            )}
            {order.payment_type === 'full-payment' && order.status !== 'pending' && (
              <span className="px-3 sm:px-4 py-2 sm:py-2.5 bg-purple-100 text-purple-700 rounded-lg flex items-center justify-center space-x-1 sm:space-x-2 text-xs sm:text-sm">
                <CreditCard className="h-4 w-4" />
                <span>Submitted</span>
              </span>
            )}
            <button
              onClick={() => handleDeleteClick(order)}
              disabled={isProcessing}
              className="px-3 sm:px-4 py-2 sm:py-2.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-1 sm:space-x-2 text-xs sm:text-sm"
              title="Delete order"
            >
              {isProcessing ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              <span>Delete</span>
            </button>
            {canSync && (
              <button
                onClick={() => handleSyncToSheets(order)}
                disabled={isProcessing}
                className="px-3 sm:px-4 py-2 sm:py-2.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-1 sm:space-x-2 text-xs sm:text-sm"
              >
                {isProcessing ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <ExternalLink className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">Sync to Sheets</span>
                <span className="sm:hidden">Sync</span>
              </button>
            )}
            {order.synced_to_sheets && (
              <span className="px-2 sm:px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs flex items-center justify-center space-x-1">
                <Check className="h-4 w-4" />
                <span>Synced</span>
              </span>
            )}
          </div>
        </div>

      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showRejectModal}
        title="Reject Order"
        message={`Are you sure you want to reject order #${orderToReject?.id.substring(0, 8)}? This action cannot be undone.`}
        confirmText="Reject Order"
        cancelText="Cancel"
        type="danger"
        onConfirm={handleRejectConfirm}
        onCancel={() => {
          setShowRejectModal(false);
          setOrderToReject(null);
        }}
      />

      <ConfirmationModal
        isOpen={showDeleteModal}
        title="Delete Order"
        message={`Are you sure you want to delete order #${orderToDelete?.id.substring(0, 8)}? This action cannot be undone and will permanently remove the order from the system.`}
        confirmText="Delete Order"
        cancelText="Cancel"
        type="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setShowDeleteModal(false);
          setOrderToDelete(null);
        }}
      />

      <NoteModal
        isOpen={showNoteModal}
        onSave={handleSaveNote}
        onCancel={handleCloseNoteModal}
        noteValue={noteValue}
        onNoteChange={setNoteValue}
        isSaving={processingOrderId !== null}
      />

      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
      />

      {!webhookUrl && (
        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-800 mb-1">Google Sheets Webhook Not Configured</h3>
              <p className="text-sm text-yellow-700">
                Please set the Google Apps Script webhook URL in the environment variables or site settings to enable automatic syncing.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">Order Verification</h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            className={`px-3 sm:px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 text-sm sm:text-base ${
              showFilterPanel 
                ? 'bg-rca-green text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">Filters</span>
          </button>
          <button
            onClick={() => fetchOrders()}
            className="px-3 sm:px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2 text-sm sm:text-base"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by order number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rca-green focus:border-rca-green"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Panel */}
      {showFilterPanel && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Filter by City */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Location
              </label>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rca-green focus:border-rca-green"
              >
                <option value="all">All Cities</option>
                {availableCities.map(city => (
                  <option key={city.name} value={city.name}>
                    {city.name} ({city.count})
                  </option>
                ))}
              </select>
            </div>

            {/* Filter by Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rca-green focus:border-rca-green"
              />
            </div>

            {/* Filter by Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rca-green focus:border-rca-green"
              >
                <option value="all">All</option>
                <option value="pending">Pending ({filterCounts.pending})</option>
                <option value="approved">Approved ({filterCounts.approved})</option>
                <option value="submitted">Submitted ({filterCounts.submitted})</option>
              </select>
            </div>

            {/* Sort by Date Proximity */}
            <div className="flex items-center">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sortByDateProximity}
                  onChange={(e) => {
                    setSortByDateProximity(e.target.checked);
                    if (e.target.checked) {
                      setSortByDateReverse(false); // Uncheck reverse if proximity is checked
                    }
                  }}
                  className="w-4 h-4 text-rca-green border-gray-300 rounded focus:ring-rca-green focus:ring-2"
                />
                <span className="text-sm font-medium text-gray-700">
                  Sort by Date (Closer to Today First)
                </span>
              </label>
            </div>

            {/* Sort by Date Reverse */}
            <div className="flex items-center">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sortByDateReverse}
                  onChange={(e) => {
                    setSortByDateReverse(e.target.checked);
                    if (e.target.checked) {
                      setSortByDateProximity(false); // Uncheck proximity if reverse is checked
                    }
                  }}
                  className="w-4 h-4 text-rca-green border-gray-300 rounded focus:ring-rca-green focus:ring-2"
                />
                <span className="text-sm font-medium text-gray-700">
                  Sort by Date (Longer First, Closer at Bottom)
                </span>
              </label>
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCity('all');
                  setSelectedDate('');
                  setStatusFilter('all');
                  setSortByDateProximity(false);
                  setSortByDateReverse(false);
                }}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pending Orders */}
      <div>
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
          Pending Orders ({pendingOrders.length})
        </h3>
        {pendingOrders.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-6 sm:p-8 text-center">
            <p className="text-sm sm:text-base text-gray-500">No pending orders</p>
          </div>
        ) : (
          pendingOrders.map(order => (
            <OrderCard key={`${order.id}-${order.status}-${refreshKey}`} order={order} />
          ))
        )}
      </div>

      {/* Approved Orders (Not Synced) */}
      {approvedOrders.filter(o => !o.synced_to_sheets).length > 0 && (
        <div>
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
            Approved Orders - Pending Sync ({approvedOrders.filter(o => !o.synced_to_sheets).length})
          </h3>
          {approvedOrders
            .filter(o => !o.synced_to_sheets)
            .map(order => (
              <OrderCard key={`${order.id}-${order.status}-${refreshKey}`} order={order} />
            ))}
        </div>
      )}

      {/* Synced Orders */}
      {syncedOrders.length > 0 && (
        <div>
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
            Synced Orders ({syncedOrders.length})
          </h3>
          {syncedOrders.map(order => (
            <OrderCard key={`${order.id}-${order.status}-${refreshKey}`} order={order} />
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderVerification;

