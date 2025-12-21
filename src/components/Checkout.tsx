import React, { useState } from 'react';
import { ArrowLeft, AlertCircle, Copy, Check } from 'lucide-react';
import { CartItem, PaymentMethod, ServiceType } from '../types';
import { usePaymentMethods } from '../hooks/usePaymentMethods';
import { useSiteSettings } from '../hooks/useSiteSettings';
import { useOrders } from '../hooks/useOrders';

interface CheckoutProps {
  cartItems: CartItem[];
  totalPrice: number;
  onBack: () => void;
}

const MINIMUM_DELIVERY_AMOUNT = 150;

const Checkout: React.FC<CheckoutProps> = ({ cartItems, totalPrice, onBack }) => {
  const { paymentMethods } = usePaymentMethods();
  const { siteSettings } = useSiteSettings();
  const { createOrder } = useOrders();
  const [step, setStep] = useState<'details' | 'payment'>('details');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSaved, setOrderSaved] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [contactNumber2, setContactNumber2] = useState('');
  const [serviceType, setServiceType] = useState<ServiceType>('delivery');
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('Lapu-Lapu City');
  const [pickupDate, setPickupDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [pickupTime, setPickupTime] = useState('09:00');
  const [deliveryDate, setDeliveryDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [deliveryTime, setDeliveryTime] = useState('12:00');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('gcash');
  const [paymentType, setPaymentType] = useState<'down-payment' | 'full-payment'>('down-payment');
  const [downPaymentAmount, setDownPaymentAmount] = useState<number>(500);
  const [deliveryPaymentMethod, setDeliveryPaymentMethod] = useState<'cod' | 'gcash-on-delivery'>('cod');
  const [copyAccountSuccess, setCopyAccountSuccess] = useState(false);

  const SHOP_ADDRESS = 'Gabi Road, Cordova, Lapu-Lapu City';
  const CITIES = ['Lapu-Lapu City', 'Cebu City', 'Mandaue City', 'Talisay', 'Minglanilla', 'Consolacion', 'Liloan'];

  // Generate time slots with 30-minute intervals (9:00 AM to 7:30 PM)
  const generateTimeSlots = () => {
    const slots: string[] = [];
    for (let hour = 9; hour < 20; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    return slots;
  };

  const pickupTimeSlots = generateTimeSlots();
  const deliveryTimeSlots = generateTimeSlots();

  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  // If COD is selected for delivery, force down payment
  React.useEffect(() => {
    if (serviceType === 'delivery' && deliveryPaymentMethod === 'cod' && paymentType === 'full-payment') {
      setPaymentType('down-payment');
      if (downPaymentAmount < 500) {
        setDownPaymentAmount(500);
      }
    }
  }, [serviceType, deliveryPaymentMethod, paymentType, downPaymentAmount]);

  // Use payment methods from database
  const effectivePaymentMethods = paymentMethods;

  // Set default payment method when payment methods are loaded
  React.useEffect(() => {
    if (effectivePaymentMethods.length > 0 && !paymentMethod) {
      setPaymentMethod((effectivePaymentMethods[0].id as PaymentMethod) || 'gcash');
    }
  }, [effectivePaymentMethods, paymentMethod]);

  const selectedPaymentMethod = effectivePaymentMethods.find(method => method.id === paymentMethod);
  
  // Check if delivery is enabled
  const isDeliveryEnabled = siteSettings?.delivery_enabled === 'true';

  const handleProceedToPayment = () => {
    setStep('payment');
  };

  // Generate order details message (reusable for both link and copy)
  const generateOrderDetails = (orderNumber?: string) => {
    const completeAddress = serviceType === 'delivery' ? `${address}` : SHOP_ADDRESS;
    const landmarkInfo = serviceType === 'delivery' ? landmark : '';

    // Format number with commas
    const formatPrice = (price: number) => {
      return price.toLocaleString('en-US');
    };

    // Format contact number with dashes (e.g., 0935-257-5468)
    const formatContactNumber = (number: string) => {
      // Remove any existing dashes or spaces
      const cleaned = number.replace(/[-\s]/g, '');
      // Format as XXX-XXX-XXXX
      if (cleaned.length === 11) {
        return `${cleaned.substring(0, 4)}-${cleaned.substring(4, 7)}-${cleaned.substring(7)}`;
      }
      return number; // Return original if not 11 digits
    };

    const formatTimeWithAMPM = (timeString: string) => {
      const [hours, minutes] = timeString.split(':').map(Number);
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      return `${displayHours}:${minutes.toString().padStart(2, '0')}${ampm}`;
    };

    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      const month = months[date.getMonth()];
      const day = date.getDate();
      const year = date.getFullYear();
      return `${month} ${day}, ${year}`;
    };

    const selectedDate = serviceType === 'pickup' ? pickupDate : deliveryDate;
    const selectedTime = serviceType === 'pickup' ? pickupTime : deliveryTime;
    // Format: "December 18, 2025         5:30PM" (with spaces between date and time)
    const dateTimeDisplay = `${formatDate(selectedDate)}         ${formatTimeWithAMPM(selectedTime)}`;

    // Format order items: price with commas first, then item name
    const orderItemsText = cartItems.map(item => {
      const itemPrice = item.totalPrice * item.quantity;
      let itemName = item.name;
      
      if (item.selectedVariation) {
        itemName += ` ${item.selectedVariation.name}`;
      }
      if (item.selectedAddOns && item.selectedAddOns.length > 0) {
        itemName += ` + ${item.selectedAddOns.map(addOn => 
          addOn.quantity && addOn.quantity > 1 
            ? `${addOn.name} x${addOn.quantity}`
            : addOn.name
        ).join(', ')}`;
      }
      if (item.quantity > 1) {
        itemName += ` x${item.quantity}`;
      }
      
      // Format: "2,900 Bilao Fried Chicken" (price with comma, then name)
      return `${formatPrice(itemPrice)} ${itemName}`;
    }).join('\n');

    // Determine payment method name
    let paymentMethodName: string;
    if (serviceType === 'delivery') {
      // For delivery, use the delivery payment method
      paymentMethodName = deliveryPaymentMethod === 'cod' ? 'COD' : 'GCash on Delivery';
    } else {
      // For pickup, use the selected payment method
      paymentMethodName = selectedPaymentMethod?.name || paymentMethod || 'GCash';
    }
    
    // Format payment info
    let paymentInfo: string;
    if (paymentType === 'down-payment') {
      const remainingBalance = totalPrice - downPaymentAmount;
      // Format: "2,900-1,450 DP" (no space before DP)
      paymentInfo = `${formatPrice(totalPrice)}-${formatPrice(downPaymentAmount)} DP\n\n${formatPrice(remainingBalance)} Bal. ${paymentMethodName}`;
    } else {
      // Full payment format
      paymentInfo = `${formatPrice(totalPrice)} ${paymentMethodName}`;
    }

    // Build message - keep original case for address, landmark, city, customer name
    let orderDetails = `${dateTimeDisplay}

${completeAddress}

${landmarkInfo ? `${landmarkInfo}\n` : ''}

${city}

${customerName}

${formatContactNumber(contactNumber)}
${contactNumber2 ? `${formatContactNumber(contactNumber2)}\n` : ''}

${orderItemsText}

${paymentInfo}`;

    // Add order number at the beginning if provided
    if (orderNumber) {
      orderDetails = `Order #${orderNumber}\n\n${orderDetails}`;
    }

    return orderDetails;
  };

  const handleCopyAccountNumber = async () => {
    if (!selectedPaymentMethod) return;
    
    try {
      await navigator.clipboard.writeText(selectedPaymentMethod.account_number);
      setCopyAccountSuccess(true);
      setTimeout(() => setCopyAccountSuccess(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = selectedPaymentMethod.account_number;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopyAccountSuccess(true);
        setTimeout(() => setCopyAccountSuccess(false), 2000);
      } catch (fallbackErr) {
        console.error('Failed to copy:', fallbackErr);
      }
      document.body.removeChild(textArea);
    }
  };

  // Generate a unique fingerprint for the current order to prevent duplicates
  const generateOrderFingerprint = (): string => {
    const orderData = {
      items: cartItems.map(item => ({
        id: item.id.split(':::CART:::')[0], // Get original menu item ID
        quantity: item.quantity,
        variation: item.selectedVariation?.id,
        addOns: item.selectedAddOns?.map(a => a.id).sort(),
      })),
      customer: customerName,
      contact: contactNumber,
      total: totalPrice,
      serviceType,
      timestamp: Date.now(),
    };
    // Create a simple hash from the order data
    const dataString = JSON.stringify(orderData);
    let hash = 0;
    for (let i = 0; i < dataString.length; i++) {
      const char = dataString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `order_${Math.abs(hash)}_${Date.now()}`;
  };

  // Check if this order was already saved recently (within last 5 minutes)
  const isDuplicateOrder = (): boolean => {
    if (orderSaved) return true; // Already saved in this session
    
    const savedOrders = JSON.parse(sessionStorage.getItem('savedOrders') || '[]');
    
    // Check if a similar order was saved recently (same items, customer, within 5 minutes)
    const recentOrder = savedOrders.find((saved: { fingerprint: string; timestamp: number }) => {
      const timeDiff = Date.now() - saved.timestamp;
      return timeDiff < 5 * 60 * 1000; // 5 minutes
    });
    
    if (recentOrder) {
      // Compare order data (excluding timestamp)
      const currentData = JSON.parse(JSON.stringify({
        items: cartItems.map(item => ({
          id: item.id.split(':::CART:::')[0],
          quantity: item.quantity,
          variation: item.selectedVariation?.id,
          addOns: item.selectedAddOns?.map(a => a.id).sort(),
        })),
        customer: customerName,
        contact: contactNumber,
        total: totalPrice,
        serviceType,
      }));
      
      const savedData = recentOrder.orderData;
      
      return JSON.stringify(currentData) === JSON.stringify(savedData);
    }
    
    return false;
  };

  const saveOrderToDatabase = async () => {
    // Check for duplicate orders
    if (isDuplicateOrder()) {
      throw new Error('This order has already been saved. Please do not submit duplicate orders.');
    }

    // Get IP address (optional, for rate limiting)
    let ipAddress = '';
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      ipAddress = data.ip;
    } catch (err) {
      console.warn('Could not fetch IP address:', err);
    }

    // Save order to database
    const order = await createOrder({
      customerName,
      contactNumber,
      contactNumber2: contactNumber2 || undefined,
      serviceType,
      address: serviceType === 'delivery' ? address : undefined,
      landmark: serviceType === 'delivery' ? landmark : undefined,
      city: city || undefined, // Save city for both pickup and delivery
      pickupDate: serviceType === 'pickup' ? pickupDate : undefined,
      pickupTime: serviceType === 'pickup' ? pickupTime : undefined,
      deliveryDate: serviceType === 'delivery' ? deliveryDate : undefined,
      deliveryTime: serviceType === 'delivery' ? deliveryTime : undefined,
      paymentMethod: serviceType === 'delivery' 
        ? (deliveryPaymentMethod === 'cod' ? 'cod' : 'gcash')
        : paymentMethod,
      paymentType: paymentType,
      downPaymentAmount: paymentType === 'down-payment' ? downPaymentAmount : undefined,
      notes: undefined, // Add notes field if needed
      total: totalPrice,
      items: cartItems,
      ipAddress,
    });

    // Return order ID (first 8 characters)
    const orderNumber = order.id.substring(0, 8);

    // Mark order as saved and store in sessionStorage
    setOrderSaved(true);
    const fingerprint = generateOrderFingerprint();
    const orderData = {
      items: cartItems.map(item => ({
        id: item.id.split(':::CART:::')[0],
        quantity: item.quantity,
        variation: item.selectedVariation?.id,
        addOns: item.selectedAddOns?.map(a => a.id).sort(),
      })),
      customer: customerName,
      contact: contactNumber,
      total: totalPrice,
      serviceType,
    };
    
    const savedOrders = JSON.parse(sessionStorage.getItem('savedOrders') || '[]');
    savedOrders.push({
      fingerprint,
      orderData,
      timestamp: Date.now(),
    });
    
    // Keep only last 10 orders in sessionStorage
    const recentOrders = savedOrders.slice(-10);
    sessionStorage.setItem('savedOrders', JSON.stringify(recentOrders));

    return orderNumber;
  };

  const [showInstructionModal, setShowInstructionModal] = useState(false);
  const [pendingMessengerUrl, setPendingMessengerUrl] = useState<string | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [copiedOrderDetails, setCopiedOrderDetails] = useState<string>('');

  const handlePlaceOrder = async () => {
    if (orderSaved) {
      alert('This order has already been saved. Please do not submit duplicate orders.');
      return;
    }

    try {
      setIsSubmitting(true);

      // Save order to database and get order number
      const orderNumber = await saveOrderToDatabase();

      // Generate order details and copy to clipboard
      const orderDetails = generateOrderDetails(orderNumber);
      
      // Store order details for receipt view
      setCopiedOrderDetails(orderDetails);
      
      // Copy to clipboard
      try {
        await navigator.clipboard.writeText(orderDetails);
      } catch (err) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = orderDetails;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        try {
          document.execCommand('copy');
        } catch (fallbackErr) {
          console.error('Failed to copy:', fallbackErr);
        }
        document.body.removeChild(textArea);
      }

      // Prepare messenger URL
      const encodedMessage = encodeURIComponent(orderDetails);
      const messengerUrl = `https://m.me/RCALechonBellyAndBilao?text=${encodedMessage}`;
      
      // Show instruction modal before opening messenger
      setPendingMessengerUrl(messengerUrl);
      setShowInstructionModal(true);
    } catch (error: any) {
      console.error('Error placing order:', error);
      const errorMessage = error.message?.includes('already been saved') 
        ? error.message 
        : 'Failed to save order. Please try again or contact support.';
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContinueToMessenger = () => {
    if (pendingMessengerUrl) {
      window.open(pendingMessengerUrl, '_blank');
      setShowInstructionModal(false);
      setPendingMessengerUrl(null);
      // Show receipt view after closing modal
      setShowReceipt(true);
    }
  };

  const isDeliveryMinimumMet = serviceType !== 'delivery' || totalPrice >= MINIMUM_DELIVERY_AMOUNT;
  
  const isDetailsValid = customerName && contactNumber && 
    (serviceType !== 'delivery' || (address && city && deliveryDate && deliveryTime)) && 
    (serviceType !== 'pickup' || (pickupDate && pickupTime)) &&
    isDeliveryMinimumMet;

  if (step === 'details') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-4 sm:py-8 pb-32 sm:pb-8">
        <div className="flex items-center mb-8">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-black transition-colors duration-200"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Cart</span>
          </button>
          <h1 className="text-3xl font-playfair font-semibold text-rca-green ml-8">Order Details</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div className="bg-rca-off-white rounded-xl shadow-sm p-6 border border-rca-green/20">
            <h2 className="text-2xl font-playfair font-medium text-rca-green mb-6">Order Summary</h2>
            
            <div className="space-y-4 mb-6">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-2 border-b border-rca-green/20">
                  <div>
                    <h4 className="font-medium text-rca-green">{item.name}</h4>
                    {item.selectedVariation && (
                      <p className="text-sm text-rca-text-light">Size: {item.selectedVariation.name}</p>
                    )}
                    {item.selectedAddOns && item.selectedAddOns.length > 0 && (
                      <p className="text-sm text-rca-text-light">
                        Add-ons: {item.selectedAddOns.map(addOn => addOn.name).join(', ')}
                      </p>
                    )}
                    <p className="text-sm text-rca-text-light">₱{item.totalPrice} x {item.quantity}</p>
                  </div>
                  <span className="font-semibold text-rca-green">₱{item.totalPrice * item.quantity}</span>
                </div>
              ))}
            </div>
            
            <div className="border-t border-rca-green/20 pt-4">
              <div className="flex items-center justify-between text-2xl font-playfair font-semibold text-rca-green">
                <span>Total:</span>
                <span className="text-rca-red">₱{totalPrice}</span>
              </div>
            </div>
            
            {/* Delivery Minimum Order Warning */}
            {serviceType === 'delivery' && totalPrice < MINIMUM_DELIVERY_AMOUNT && (
              <div className="mt-4 bg-red-50 border-2 border-red-300 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-red-800 mb-1">Minimum Order Not Met</h4>
                    <p className="text-sm text-red-700">
                      Delivery orders require a minimum of <span className="font-bold">₱{MINIMUM_DELIVERY_AMOUNT}</span>. 
                      Please add <span className="font-bold">₱{MINIMUM_DELIVERY_AMOUNT - totalPrice}</span> more to proceed.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Customer Details Form */}
          <div className="bg-rca-off-white rounded-xl shadow-sm p-6 border border-rca-green/20">
            <h2 className="text-2xl font-playfair font-medium text-rca-green mb-6">Customer Information</h2>
            
            <form className="space-y-6">
              {/* Customer Information */}
              <div>
                <label className="block text-sm font-medium text-rca-green mb-2">Full Name *</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-4 py-3 border border-rca-green/20 rounded-lg focus:ring-2 focus:ring-rca-red focus:border-rca-red transition-all duration-200 bg-rca-off-white"
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-rca-green mb-2">Mobile No 1 *</label>
                <input
                  type="tel"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  className="w-full px-4 py-3 border border-rca-green/20 rounded-lg focus:ring-2 focus:ring-rca-red focus:border-rca-red transition-all duration-200 bg-rca-off-white"
                  placeholder="09XX XXX XXXX"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-rca-green mb-2">Mobile No 2 (Optional)</label>
                <input
                  type="tel"
                  value={contactNumber2}
                  onChange={(e) => setContactNumber2(e.target.value)}
                  className="w-full px-4 py-3 border border-rca-green/20 rounded-lg focus:ring-2 focus:ring-rca-red focus:border-rca-red transition-all duration-200 bg-rca-off-white"
                  placeholder="09XX XXX XXXX"
                />
              </div>

              {/* Service Type */}
              <div>
                <label className="block text-sm font-medium text-rca-green mb-3">Service Type *</label>
                <div className={`grid gap-3 ${isDeliveryEnabled ? 'grid-cols-2' : 'grid-cols-1'}`}>
                  {[
                    { value: 'pickup', label: 'Pickup', icon: '🚶', enabled: true },
                    { value: 'delivery', label: 'Delivery', icon: '🛵', enabled: isDeliveryEnabled }
                  ].filter(option => option.enabled).map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setServiceType(option.value as ServiceType)}
                      className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                        serviceType === option.value
                          ? 'border-rca-red bg-rca-red text-white'
                          : 'border-rca-green/20 bg-rca-off-white text-gray-700 hover:border-rca-red'
                      }`}
                    >
                      <div className="text-2xl mb-1">{option.icon}</div>
                      <div className="text-sm font-medium">{option.label}</div>
                    </button>
                  ))}
                </div>
                
                {/* Shop address - only show if delivery is enabled */}
                {isDeliveryEnabled && (
                  <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs text-blue-800">
                      <span className="font-medium">📍 Our Shop Address:</span><br />
                      {SHOP_ADDRESS}
                    </p>
                  </div>
                )}
                
                {/* Delivery disabled message */}
                {!isDeliveryEnabled && (
                  <div className="mt-3 bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <p className="text-xs text-gray-600">
                      <span className="font-medium">ℹ️ Note:</span> Delivery service is currently unavailable
                    </p>
                  </div>
                )}
              </div>

              {/* Pickup Date and Time Selection */}
              {serviceType === 'pickup' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-rca-green mb-2">City *</label>
                    <select
                      aria-label="City"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-4 py-3 border border-rca-green/20 rounded-lg focus:ring-2 focus:ring-rca-red focus:border-rca-red transition-all duration-200 bg-rca-off-white"
                      required
                    >
                      {CITIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-rca-green mb-2">Pickup Date *</label>
                    <input
                      type="date"
                      aria-label="Pickup Date"
                      value={pickupDate}
                      onChange={(e) => setPickupDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 border border-rca-green/20 rounded-lg focus:ring-2 focus:ring-rca-red focus:border-rca-red transition-all duration-200 bg-rca-off-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-rca-green mb-2">Pickup Time *</label>
                    <p className="text-sm text-rca-text-light mb-3">Shop closes at 8:00 PM</p>
                    <select
                      value={pickupTime}
                      onChange={(e) => setPickupTime(e.target.value)}
                      className="w-full px-4 py-3 border border-rca-green/20 rounded-lg focus:ring-2 focus:ring-rca-red focus:border-rca-red transition-all duration-200 bg-rca-off-white"
                      required
                    >
                      {pickupTimeSlots.map((time) => {
                        const [hours, minutes] = time.split(':').map(Number);
                        const ampm = hours >= 12 ? 'PM' : 'AM';
                        const displayHours = hours % 12 || 12;
                        const displayTime = `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
                        return (
                          <option key={time} value={time}>
                            {displayTime}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </>
              )}

              {/* Delivery Address, Date and Time */}
              {serviceType === 'delivery' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-rca-green mb-2">Delivery Address *</label>
                    <textarea
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full px-4 py-3 border border-rca-green/20 rounded-lg focus:ring-2 focus:ring-rca-red focus:border-rca-red transition-all duration-200 bg-rca-off-white"
                      placeholder="Enter your complete delivery address"
                      rows={3}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-rca-green mb-2">City *</label>
                    <select
                      aria-label="City"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-4 py-3 border border-rca-green/20 rounded-lg focus:ring-2 focus:ring-rca-red focus:border-rca-red transition-all duration-200 bg-rca-off-white"
                      required
                    >
                      {CITIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-rca-green mb-2">Landmark</label>
                    <input
                      type="text"
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      className="w-full px-4 py-3 border border-rca-green/20 rounded-lg focus:ring-2 focus:ring-rca-red focus:border-rca-red transition-all duration-200 bg-rca-off-white"
                      placeholder="e.g., Near McDonald's, Beside 7-Eleven, In front of school"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-rca-green mb-2">Delivery Date *</label>
                    <input
                      type="date"
                      aria-label="Delivery Date"
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 border border-rca-green/20 rounded-lg focus:ring-2 focus:ring-rca-red focus:border-rca-red transition-all duration-200 bg-rca-off-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-rca-green mb-2">Delivery Time *</label>
                    <p className="text-sm text-rca-text-light mb-3">Delivery hours: 9:00 AM - 7:30 PM</p>
                    <select
                      value={deliveryTime}
                      onChange={(e) => setDeliveryTime(e.target.value)}
                      className="w-full px-4 py-3 border border-rca-green/20 rounded-lg focus:ring-2 focus:ring-rca-red focus:border-rca-red transition-all duration-200 bg-rca-off-white"
                      required
                    >
                      {deliveryTimeSlots.map((time) => {
                        const [hours, minutes] = time.split(':').map(Number);
                        const ampm = hours >= 12 ? 'PM' : 'AM';
                        const displayHours = hours % 12 || 12;
                        const displayTime = `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
                        return (
                          <option key={time} value={time}>
                            {displayTime}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </>
              )}

              <div className="pb-4 sm:pb-0">
                <button
                  onClick={handleProceedToPayment}
                  disabled={!isDetailsValid}
                  className={`w-full py-4 rounded-xl font-medium text-lg transition-all duration-200 transform ${
                    isDetailsValid
                      ? 'bg-rca-red text-white hover:bg-rca-red-dark hover:scale-[1.02]'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Proceed to Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Payment Step
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 bg-rca-off-white">
      <div className="flex items-center mb-8">
        <button
          onClick={() => setStep('details')}
          className="flex items-center space-x-2 text-rca-text-light hover:text-rca-green transition-colors duration-200"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Details</span>
        </button>
        <h1 className="text-3xl font-playfair font-semibold text-rca-green ml-8">Payment</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Payment Method Selection */}
        <div className="bg-rca-off-white rounded-xl shadow-sm p-6 border border-rca-green/20">
          <h2 className="text-2xl font-playfair font-medium text-rca-green mb-6">Payment Options</h2>
          
          {/* Delivery Payment Method Selection - Only show for delivery */}
          {serviceType === 'delivery' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-rca-green mb-3">Payment Method on Delivery *</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setDeliveryPaymentMethod('cod');
                    // If COD is selected, force down payment and disable full payment
                    setPaymentType('down-payment');
                    if (downPaymentAmount < 500) {
                      setDownPaymentAmount(500);
                    }
                  }}
                  className={`py-3 px-4 rounded-lg font-medium text-base transition-all duration-200 border-2 ${
                    deliveryPaymentMethod === 'cod'
                      ? 'bg-rca-green text-white border-rca-green'
                      : 'bg-white text-rca-green border-rca-green/30 hover:border-rca-green'
                  }`}
                >
                  COD
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryPaymentMethod('gcash-on-delivery')}
                  className={`py-3 px-4 rounded-lg font-medium text-base transition-all duration-200 border-2 ${
                    deliveryPaymentMethod === 'gcash-on-delivery'
                      ? 'bg-rca-green text-white border-rca-green'
                      : 'bg-white text-rca-green border-rca-green/30 hover:border-rca-green'
                  }`}
                >
                  GCash on Delivery
                </button>
              </div>
              {deliveryPaymentMethod === 'cod' && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <span className="font-medium">⚠️ Note:</span> Down payment is required for COD orders.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Payment Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-rca-green mb-3">Payment Type *</label>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                type="button"
                onClick={() => {
                  setPaymentType('down-payment');
                  if (downPaymentAmount < 500) {
                    setDownPaymentAmount(500);
                  } else if (downPaymentAmount > totalPrice) {
                    setDownPaymentAmount(totalPrice);
                  }
                }}
                className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                  paymentType === 'down-payment'
                    ? 'border-rca-red bg-rca-red text-white'
                    : 'border-rca-green/20 bg-rca-off-white text-gray-700 hover:border-rca-red'
                }`}
              >
                <div className="text-lg font-medium">Down Payment</div>
                <div className="text-xs mt-1 opacity-90">Minimum ₱500</div>
              </button>
              <button
                type="button"
                onClick={() => setPaymentType('full-payment')}
                disabled={serviceType === 'delivery' && deliveryPaymentMethod === 'cod'}
                className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                  paymentType === 'full-payment'
                    ? 'border-rca-red bg-rca-red text-white'
                    : 'border-rca-green/20 bg-rca-off-white text-gray-700 hover:border-rca-red'
                } ${
                  serviceType === 'delivery' && deliveryPaymentMethod === 'cod'
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
                }`}
              >
                <div className="text-lg font-medium">Full Payment</div>
                <div className="text-xs mt-1 opacity-90">₱{totalPrice.toFixed(2)}</div>
              </button>
            </div>

            {/* Down Payment Amount Input */}
            {paymentType === 'down-payment' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-rca-green mb-2">
                  Down Payment Amount * (Minimum ₱500)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={downPaymentAmount}
                  onChange={(e) => {
                    // Allow only numbers
                    const inputValue = e.target.value.replace(/[^0-9]/g, '');
                    
                    // If empty, allow empty state temporarily (will validate on blur)
                    if (inputValue === '') {
                      setDownPaymentAmount(0);
                      return;
                    }
                    
                    const numValue = Number(inputValue);
                    
                    // Only cap at maximum, don't auto-set minimum while typing
                    if (numValue > totalPrice) {
                      setDownPaymentAmount(totalPrice);
                    } else {
                      setDownPaymentAmount(numValue);
                    }
                  }}
                  onBlur={() => {
                    // Validate on blur: ensure minimum 500
                    if (downPaymentAmount < 500 || downPaymentAmount === 0) {
                      setDownPaymentAmount(500);
                    }
                  }}
                  className="w-full px-4 py-3 border border-rca-green/20 rounded-lg focus:ring-2 focus:ring-rca-red focus:border-rca-red transition-all duration-200 bg-rca-off-white"
                  placeholder="Enter amount (minimum ₱500)"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Remaining balance: ₱{totalPrice - downPaymentAmount}
                </p>
              </div>
            )}

            {/* Full Payment Display */}
            {paymentType === 'full-payment' && (
              <div className="mb-4 p-4 bg-rca-green/5 rounded-lg border border-rca-green/20">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-rca-green">Full Payment Amount:</span>
                  <span className="text-xl font-bold text-rca-red">₱{totalPrice.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>

          <h3 className="text-xl font-playfair font-medium text-rca-green mb-4">Pay Here</h3>
          
          <div className="grid grid-cols-1 gap-4 mb-6">
            {effectivePaymentMethods.map((method) => (
              <button
                key={method.id}
                type="button"
                onClick={() => setPaymentMethod(method.id as PaymentMethod)}
                className={`p-4 rounded-lg border-2 transition-all duration-200 flex items-center space-x-3 ${
                  paymentMethod === method.id
                    ? 'border-rca-red bg-rca-red text-white'
                    : 'border-rca-green/20 bg-rca-off-white text-gray-700 hover:border-rca-red'
                }`}
              >
                <span className="text-2xl">💳</span>
                <span className="font-medium">{method.name}</span>
              </button>
            ))}
          </div>

          {/* Payment Details with QR Code */}
          {selectedPaymentMethod && (
            <div className="bg-rca-off-white rounded-lg p-6 mb-6 border border-rca-green/20">
              <h3 className="font-medium text-rca-green mb-4">Payment Details</h3>
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-1">{selectedPaymentMethod.name}</p>
                  <p className="font-mono text-cafe-dark font-medium mb-2">{selectedPaymentMethod.account_number}</p>
                  <button
                    onClick={handleCopyAccountNumber}
                    className="w-full sm:w-auto mb-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center space-x-2 border-2 border-rca-green text-rca-green bg-white hover:bg-rca-green/10"
                  >
                    {copyAccountSuccess ? (
                      <>
                        <Check className="h-4 w-4" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        <span>Copy {selectedPaymentMethod.name} Number</span>
                      </>
                    )}
                  </button>
                  {copyAccountSuccess && (
                    <p className="text-xs text-green-600 mb-2">✓ Account number copied to clipboard!</p>
                  )}
                  <p className="text-sm text-gray-600 mb-3">Account Name: {selectedPaymentMethod.account_name}</p>
                  <p className="text-xl font-semibold text-cafe-accent">
                    Amount: ₱{paymentType === 'down-payment' ? downPaymentAmount : totalPrice}
                  </p>
                  {paymentType === 'down-payment' && (
                    <p className="text-sm text-gray-600 mt-1">
                      Remaining: ₱{totalPrice - downPaymentAmount}
                    </p>
                  )}
                </div>
                <div className="flex-shrink-0">
                  <img 
                    src={selectedPaymentMethod.qr_code_url} 
                    alt={`${selectedPaymentMethod.name} QR Code`}
                    className="w-32 h-32 rounded-lg border-2 border-cafe-latte shadow-sm"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.pexels.com/photos/8867482/pexels-photo-8867482.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop';
                    }}
                  />
                  <p className="text-xs text-gray-500 text-center mt-2">Scan to pay</p>
                </div>
              </div>
            </div>
          )}


          {/* Payment instructions */}
          <div className="bg-cafe-cream border border-cafe-latte rounded-lg p-4">
            <h4 className="font-medium text-cafe-dark mb-3">📸 Payment Proof Required</h4>
            <div className="text-sm text-gray-700 space-y-3">
              <div>
                <p className="font-semibold mb-2">‼️ Payment Policy ‼️</p>
                <p className="mb-2">🚫 Strictly NO cancellation of order!</p>
                <p className="mb-2">
                  A down payment is required to ensure that every confirmed order is properly scheduled and avoids last-minute cancellations.
                </p>
                <p className="mb-2">
                  The balance can be paid upon delivery or pick-up.
                </p>
                <div className="border-t border-gray-300 my-3"></div>
                <p className="font-medium">Note:</p>
                <p>Please send a screenshot of your payment for verification.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-cafe-light rounded-xl shadow-sm p-6 border border-cafe-latte">
          <h2 className="text-2xl font-playfair font-medium text-cafe-dark mb-6">Final Order Summary</h2>
          
          <div className="space-y-4 mb-6">
            <div className="bg-cafe-beige rounded-lg p-4 border border-cafe-latte">
              <h4 className="font-medium text-cafe-dark mb-2">Customer Details</h4>
              <p className="text-sm text-gray-600">Name: {customerName}</p>
              <p className="text-sm text-gray-600">Contact: {contactNumber}{contactNumber2 ? `, ${contactNumber2}` : ''}</p>
              <p className="text-sm text-gray-600">Service: {serviceType.charAt(0).toUpperCase() + serviceType.slice(1)}</p>
              {serviceType === 'delivery' && (
                <>
                  <p className="text-sm text-gray-600">Address: {address}</p>
                  {landmark && <p className="text-sm text-gray-600">Landmark: {landmark}</p>}
                </>
              )}
              {serviceType === 'pickup' && (
                <>
                  <p className="text-sm text-gray-600">
                    Pickup Date: {new Date(pickupDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                  <p className="text-sm text-gray-600">
                    Pickup Time: {pickupTime}
                  </p>
                </>
              )}
              {serviceType === 'delivery' && (
                <>
                  <p className="text-sm text-gray-600">City: {city}</p>
                  <p className="text-sm text-gray-600">
                    Delivery Date: {new Date(deliveryDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                  <p className="text-sm text-gray-600">
                    Delivery Time: {deliveryTime}
                  </p>
                </>
              )}
            </div>

            {cartItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-2 border-b border-cafe-latte">
                <div>
                  <h4 className="font-medium text-cafe-dark">{item.name}</h4>
                  {item.selectedVariation && (
                    <p className="text-sm text-gray-600">Size: {item.selectedVariation.name}</p>
                  )}
                  {item.selectedAddOns && item.selectedAddOns.length > 0 && (
                    <p className="text-sm text-gray-600">
                      Add-ons: {item.selectedAddOns.map(addOn => 
                        addOn.quantity && addOn.quantity > 1 
                          ? `${addOn.name} x${addOn.quantity}`
                          : addOn.name
                      ).join(', ')}
                    </p>
                  )}
                  <p className="text-sm text-gray-600">₱{item.totalPrice} x {item.quantity}</p>
                </div>
                <span className="font-semibold text-cafe-dark">₱{item.totalPrice * item.quantity}</span>
              </div>
            ))}
          </div>
          
          <div className="border-t border-cafe-latte pt-4 mb-4">
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Payment Type:</span>
                <span className="text-sm font-semibold text-cafe-dark">
                  {paymentType === 'down-payment' ? 'Down Payment' : 'Full Payment'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Payment Amount:</span>
                <span className="text-lg font-semibold text-cafe-accent">
                  ₱{paymentType === 'down-payment' ? downPaymentAmount : totalPrice}
                </span>
              </div>
              {paymentType === 'down-payment' && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Remaining Balance:</span>
                  <span className="text-sm font-semibold text-gray-700">
                    ₱{totalPrice - downPaymentAmount}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between text-2xl font-playfair font-semibold text-cafe-dark border-t border-cafe-latte pt-4">
              <span>Total Amount:</span>
              <span className="text-cafe-accent">₱{totalPrice}</span>
            </div>
          </div>

          {/* Place Order Button */}
          <button
            onClick={handlePlaceOrder}
            disabled={isSubmitting || orderSaved}
            className="w-full py-4 rounded-xl font-medium text-lg transition-all duration-200 transform bg-cafe-accent text-white hover:bg-cafe-espresso hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {orderSaved ? 'Order Already Saved' : isSubmitting ? 'Saving Order...' : 'Place Order via Messenger'}
          </button>
          
          <p className="text-xs text-gray-500 text-center mt-3">
            You'll be redirected to Facebook Messenger to confirm your order. Don't forget to attach your payment screenshot!
          </p>
        </div>
      </div>

      {/* Instruction Modal */}
      {showInstructionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 transform transition-all">
            <div className="p-6 border-t-4 border-rca-green">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 text-rca-green">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Order Copied to Clipboard!</h3>
                  <div className="space-y-3 text-sm text-gray-700">
                    <p className="font-medium text-gray-900">Follow these steps:</p>
                    <ol className="list-decimal list-inside space-y-2 ml-2">
                      <li>Click "Continue" below to open Facebook Messenger</li>
                      <li>If your order message doesn't appear automatically, long press in the message box and tap "Paste" to paste your order</li>
                      <li>Send the message to confirm your order</li>
                    </ol>
                    <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded">
                      <p className="text-xs text-blue-800">
                        <span className="font-semibold">💡 Tip:</span> Your order is already saved in our system. If Messenger doesn't work, you can also go to our Facebook page and send the message there.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 rounded-b-xl flex items-center justify-end space-x-3">
              <button
                onClick={handleContinueToMessenger}
                className="px-6 py-2 text-sm font-medium bg-rca-green text-white rounded-lg hover:bg-rca-green/90 transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt View */}
      {showReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 my-8 transform transition-all">
            <div className="p-6 border-t-4 border-rca-green">
              <div className="text-center mb-6">
                <div className="inline-block px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-semibold mb-4">
                  COPIED
                </div>
                <h2 className="text-2xl font-playfair font-semibold text-rca-green">ORDER DETAILS</h2>
              </div>
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800 leading-relaxed">
                  {copiedOrderDetails}
                </pre>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 rounded-b-xl flex items-center justify-end">
              <button
                onClick={() => {
                  setShowReceipt(false);
                  // Reset form and go back to menu
                  window.location.href = '/';
                }}
                className="px-6 py-2 text-sm font-medium bg-rca-green text-white rounded-lg hover:bg-rca-green/90 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;