import React, { useState, useMemo } from 'react';
import { Check, X, RefreshCw, ExternalLink, Calendar, Phone, MapPin, CreditCard, Package, AlertCircle } from 'lucide-react';
import { Order } from '../types';
import { useOrders } from '../hooks/useOrders';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 transform transition-all">
        <div className={`p-6 border-t-4 ${colors.border}`}>
          <div className="flex items-start space-x-4">
            <div className={`flex-shrink-0 ${colors.icon}`}>
              {type === 'danger' && <X className="h-6 w-6" />}
              {type === 'warning' && <AlertCircle className="h-6 w-6" />}
              {type === 'info' && <AlertCircle className="h-6 w-6" />}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
              <p className="text-sm text-gray-600">{message}</p>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 bg-gray-50 rounded-b-xl flex items-center justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${colors.button}`}
          >
            {confirmText}
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
    <div className="fixed top-4 right-4 z-50 animate-slide-in">
      <div className={`${colorClasses[type]} border-2 rounded-lg p-4 shadow-lg flex items-center space-x-3 min-w-[300px] max-w-md`}>
        <div className="flex-shrink-0">{icons[type]}</div>
        <p className="flex-1 text-sm font-medium">{message}</p>
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
  const { orders, loading, fetchOrders, updateOrderStatus, syncOrderToSheets } = useOrders();
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [refreshKey, setRefreshKey] = useState(0); // Force re-render
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [orderToReject, setOrderToReject] = useState<Order | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' | 'info'; isVisible: boolean }>({
    message: '',
    type: 'info',
    isVisible: false
  });

  // Use useMemo to ensure filtering happens with latest data
  const pendingOrders = useMemo(() => 
    orders.filter(order => order.status === 'pending'), 
    [orders, refreshKey]
  );
  const approvedOrders = useMemo(() => 
    orders.filter(order => order.status === 'approved'), 
    [orders, refreshKey]
  );
  const syncedOrders = useMemo(() => 
    orders.filter(order => order.status === 'synced'), 
    [orders, refreshKey]
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

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setToast({ message, type, isVisible: true });
    setTimeout(() => {
      setToast(prev => ({ ...prev, isVisible: false }));
    }, 5000);
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

  const OrderCard = ({ order }: { order: Order }) => {
    const isProcessing = processingOrderId === order.id;
    const canSync = order.status === 'approved' && !order.synced_to_sheets && webhookUrl;

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-4">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Order #{order.id.substring(0, 8)}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {formatDate(order.created_at)}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
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
            <div className="flex items-center space-x-2 text-sm">
              <Phone className="h-4 w-4 text-gray-400" />
              <span className="font-medium">{order.customer_name}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Phone className="h-4 w-4 text-gray-400" />
              <span>{order.contact_number}</span>
              {order.contact_number2 && <span> / {order.contact_number2}</span>}
            </div>
            {order.address && (
              <div className="flex items-start space-x-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                <span>{order.address}{order.landmark ? `, ${order.landmark}` : ''}</span>
              </div>
            )}
            {order.city && (
              <div className="text-sm text-gray-600 ml-6">{order.city}</div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm">
              <Package className="h-4 w-4 text-gray-400" />
              <span className="font-medium capitalize">{order.service_type}</span>
            </div>
            {(order.pickup_date || order.delivery_date) && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span>
                  {order.service_type === 'pickup' 
                    ? `${order.pickup_date} at ${order.pickup_time}`
                    : order.service_type === 'delivery'
                    ? `${order.delivery_date} at ${order.delivery_time}`
                    : 'N/A'
                  }
                </span>
              </div>
            )}
            <div className="flex items-center space-x-2 text-sm">
              <CreditCard className="h-4 w-4 text-gray-400" />
              <span className="font-medium">{order.payment_method}</span>
              {order.payment_type && (
                <span className="text-gray-600">
                  ({order.payment_type === 'down-payment' ? 'Down Payment' : 'Full Payment'})
                  {order.payment_type === 'down-payment' && order.down_payment_amount && (
                    <span className="ml-1">- ₱{order.down_payment_amount.toFixed(2)}</span>
                  )}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Order Items */}
        {order.order_items && order.order_items.length > 0 && (
          <div className="mb-4">
            <h4 className="font-medium text-gray-900 mb-2">Items:</h4>
            <div className="space-y-1">
              {order.order_items.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                  <div className="flex-1">
                    <span className="font-medium">{item.name}</span>
                    {item.variation && (
                      <span className="text-gray-600"> - {JSON.parse(item.variation as any)?.name || 'Variation'}</span>
                    )}
                    {item.add_ons && item.add_ons.length > 0 && (
                      <span className="text-gray-600">
                        {' + '}
                        {JSON.parse(item.add_ons as any).map((addOn: any) => addOn.name).join(', ')}
                      </span>
                    )}
                    <span className="text-gray-600"> x{item.quantity}</span>
                  </div>
                  <span className="font-medium">{formatPrice(item.subtotal)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="text-lg font-semibold text-gray-900">
            Total: <span className="text-green-600">{formatPrice(order.total)}</span>
          </div>
          <div className="flex items-center space-x-2">
            {order.status === 'pending' && (
              <>
                <button
                  onClick={() => handleRejectClick(order)}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <X className="h-4 w-4" />
                  <span>Reject</span>
                </button>
                <button
                  onClick={() => handleApprove(order)}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
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
            {canSync && (
              <button
                onClick={() => handleSyncToSheets(order)}
                disabled={isProcessing}
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isProcessing ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <ExternalLink className="h-4 w-4" />
                )}
                <span>Sync to Sheets</span>
              </button>
            )}
            {order.synced_to_sheets && (
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm flex items-center space-x-1">
                <Check className="h-4 w-4" />
                <span>Synced</span>
              </span>
            )}
          </div>
        </div>

        {order.notes && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <p className="text-sm text-yellow-800">{order.notes}</p>
            </div>
          </div>
        )}
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

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold text-gray-900">Order Verification</h2>
        <button
          onClick={() => fetchOrders()}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Pending Orders */}
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          Pending Orders ({pendingOrders.length})
        </h3>
        {pendingOrders.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <p className="text-gray-500">No pending orders</p>
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
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
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
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
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

