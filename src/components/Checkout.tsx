import React, { useState, useCallback, useRef } from 'react';
import { ArrowLeft, AlertCircle, Copy, Check } from 'lucide-react';
import { CartItem, PaymentMethod, ServiceType } from '../types';
import { usePaymentMethods } from '../hooks/usePaymentMethods';
import { useSiteSettings } from '../hooks/useSiteSettings';
import { useOrders } from '../hooks/useOrders';
import { useDateAvailability, DateAvailability } from '../hooks/useDateAvailability';

interface CheckoutProps {
  cartItems: CartItem[];
  totalPrice: number;
  onBack: () => void;
  dateAvailabilities?: DateAvailability[];
}

const MINIMUM_DELIVERY_AMOUNT = 150;

const Checkout: React.FC<CheckoutProps> = ({ cartItems, totalPrice, onBack, dateAvailabilities = [] }) => {
  const { paymentMethods } = usePaymentMethods();
  const { siteSettings } = useSiteSettings();
  const { createOrder, fetchOrders } = useOrders();
  const { getAvailabilityForDate, getDeliveryFeesForDate } = useDateAvailability();
  const getAvailabilityForDateRef = useRef(getAvailabilityForDate);
  const [deliveryFees, setDeliveryFees] = useState<Record<string, number>>({});
  const [deliveryFee, setDeliveryFee] = useState<number>(0);
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

  // Auto-set delivery/pickup date if cart items are from available date category
  // Use a ref to track the last cart items hash to prevent unnecessary re-runs
  const lastCartItemsHash = useRef<string>('');
  
  React.useEffect(() => {
    if (cartItems.length === 0 || dateAvailabilities.length === 0) {
      lastCartItemsHash.current = '';
      return;
    }

    // Create a hash of cart item IDs to detect actual changes
    const cartItemsHash = cartItems.map(item => {
      const parts = item.id.split(':::CART:::');
      return parts.length > 1 ? parts[0] : item.id.split('-')[0];
    }).sort().join(',');
    
    // Skip if cart items haven't actually changed
    if (lastCartItemsHash.current === cartItemsHash) {
      return;
    }
    
    lastCartItemsHash.current = cartItemsHash;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find the first upcoming availability that matches cart items
    const upcomingAvailabilities = dateAvailabilities
      .filter(avail => {
        const availDate = new Date(avail.date);
        availDate.setHours(0, 0, 0, 0);
        return availDate >= today && avail.available_item_ids && avail.available_item_ids.length > 0;
      })
      .sort((a, b) => a.date.localeCompare(b.date));

    for (const availability of upcomingAvailabilities) {
      const availableItemIds = availability.available_item_ids || [];
      
      // Check if any cart items match this availability
      const cartItemIds = cartItems.map(item => {
        // Extract original menu item id from cart item id
        const parts = item.id.split(':::CART:::');
        return parts.length > 1 ? parts[0] : item.id.split('-')[0];
      });

      const hasMatchingItem = cartItemIds.some(cartItemId => {
        const normalizedCartId = String(cartItemId).toLowerCase().trim();
        return availableItemIds.some(availId => String(availId).toLowerCase().trim() === normalizedCartId);
      });

      if (hasMatchingItem) {
        // Set the date to this availability date only if it's different
        const availabilityDate = availability.date; // Format: YYYY-MM-DD
        if (serviceType === 'delivery') {
          setDeliveryDate(prevDate => prevDate !== availabilityDate ? availabilityDate : prevDate);
        } else if (serviceType === 'pickup') {
          setPickupDate(prevDate => prevDate !== availabilityDate ? availabilityDate : prevDate);
        }
        break; // Use the first matching availability
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartItems.length, dateAvailabilities.length, serviceType]);

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

  // Fetch delivery fees for selected date
  React.useEffect(() => {
    const fetchFees = async () => {
      if (serviceType === 'delivery' && deliveryDate) {
        const fees = await getDeliveryFeesForDate(deliveryDate);
        if (fees) {
          setDeliveryFees(fees);
          // Set delivery fee for current city
          const fee = fees[city] || 0;
          setDeliveryFee(fee);
        } else {
          setDeliveryFees({});
          setDeliveryFee(0);
        }
      } else {
        setDeliveryFees({});
        setDeliveryFee(0);
      }
    };
    fetchFees();
  }, [serviceType, deliveryDate, city, getDeliveryFeesForDate]);

  // Update delivery fee when city changes
  React.useEffect(() => {
    if (serviceType === 'delivery' && deliveryFees[city] !== undefined) {
      setDeliveryFee(deliveryFees[city] || 0);
    } else {
      setDeliveryFee(0);
    }
  }, [city, deliveryFees, serviceType]);

  // If COD is selected for delivery, force down payment
  React.useEffect(() => {
    if (serviceType === 'delivery' && deliveryPaymentMethod === 'cod' && paymentType === 'full-payment') {
      setPaymentType('down-payment');
      const minDownPayment = 500 + deliveryFee; // Include delivery fee in minimum
      if (downPaymentAmount < minDownPayment) {
        setDownPaymentAmount(minDownPayment);
      }
    }
  }, [serviceType, deliveryPaymentMethod, paymentType, downPaymentAmount, deliveryFee]);

  // Calculate total with delivery fee
  const totalWithDeliveryFee = totalPrice + deliveryFee;

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
    // Prevent proceeding if there are unavailable items
    if (unavailableItems.length > 0) {
      alert(`Cannot proceed: Some items are not available on the selected date:\n\n${unavailableItems.join('\n')}\n\nPlease remove these items or select a different date.`);
      return;
    }
    
    // Double-check validation
    if (!isDetailsValid) {
      alert('Please fill in all required fields before proceeding.');
      return;
    }
    
    setStep('payment');
  };

  // Check item availability for selected date
  React.useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;
    
    const checkAvailability = async () => {
      if (cartItems.length === 0) {
        if (isMounted) {
          setUnavailableItems([]);
          setIsCheckingAvailability(false);
          lastCheckedRef.current = '';
        }
        return;
      }

      const selectedDate = serviceType === 'pickup' ? pickupDate : deliveryDate;
      if (!selectedDate) {
        if (isMounted) {
          setUnavailableItems([]);
          setIsCheckingAvailability(false);
          lastCheckedRef.current = '';
        }
        return;
      }

      // Create a unique key for this check to avoid duplicate requests
      const itemIds = cartItems.map(item => item.id.split(':::CART:::')[0]).sort().join(',');
      const checkKey = `${selectedDate}-${itemIds}`;
      
      // Skip if we already checked this exact combination
      if (lastCheckedRef.current === checkKey) {
        return;
      }

      try {
        if (isMounted) {
          setIsCheckingAvailability(true);
          lastCheckedRef.current = checkKey;
        }
        
        const availableItemIds = await getAvailabilityForDateRef.current(selectedDate);
        
        if (!isMounted) return;
        
        // If null, no date availability is set, so all items are available
        if (availableItemIds === null) {
          setUnavailableItems([]);
          setIsCheckingAvailability(false);
          return;
        }

        // If empty array, no items are available for this date - block all
        if (Array.isArray(availableItemIds) && availableItemIds.length === 0) {
          const allUnavailable = cartItems.map(item => item.name);
          setUnavailableItems(allUnavailable);
          setIsCheckingAvailability(false);
          return;
        }

        // Extract original menu item IDs from cart items
        // Cart item IDs are in format: "menuItemId:::CART:::timestamp-random"
        const unavailable: string[] = [];
        
        // Normalize available IDs to strings for comparison
        const normalizedAvailableIds = availableItemIds.map(id => String(id).toLowerCase().trim());
        
        cartItems.forEach(item => {
          const originalItemId = item.id.split(':::CART:::')[0];
          const normalizedCartItemId = originalItemId.toLowerCase().trim();
          
          // Check if the item ID is in the available list
          const isAvailable = normalizedAvailableIds.includes(normalizedCartItemId);
          
          if (!isAvailable) {
            unavailable.push(item.name);
          }
        });

        console.log('Date availability check:', {
          selectedDate,
          availableItemIds,
          normalizedAvailableIds,
          cartItems: cartItems.map(item => ({
            name: item.name,
            originalId: item.id.split(':::CART:::')[0],
            normalizedId: item.id.split(':::CART:::')[0].toLowerCase().trim()
          })),
          unavailable
        });

        setUnavailableItems(unavailable);
        setIsCheckingAvailability(false);
      } catch (error) {
        console.error('Error checking availability:', error);
        if (isMounted) {
          setUnavailableItems([]);
          setIsCheckingAvailability(false);
          lastCheckedRef.current = ''; // Reset on error so it can retry
        }
      }
    };

    // Debounce the check to avoid too many requests
    timeoutId = setTimeout(checkAvailability, 300);
    
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [cartItems, serviceType, pickupDate, deliveryDate]);

  // Generate readable order ID format: 12m31d-1 (month + day + customer number for that day)
  const generateReadableOrderId = async (orderId: string, orderCreatedAt: string): Promise<string> => {
    const DEPLOYMENT_DATE = new Date();
    DEPLOYMENT_DATE.setHours(0, 0, 0, 0);
    
    const orderDate = new Date(orderCreatedAt);
    
    // If order was created before deployment date, use old format
    if (orderDate < DEPLOYMENT_DATE) {
      return orderId.substring(0, 8);
    }
    
    // For new orders, fetch all orders for that date to calculate customer number
    try {
      await fetchOrders();
      // We need to fetch orders from Supabase directly to get all orders for the date
      const { supabase } = await import('../lib/supabase');
      const orderDateStr = orderDate.toISOString().split('T')[0];
      const startOfDay = new Date(orderDateStr);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(orderDateStr);
      endOfDay.setHours(23, 59, 59, 999);
      
      const { data: sameDayOrders } = await supabase
        .from('orders')
        .select('id, created_at')
        .gte('created_at', startOfDay.toISOString())
        .lte('created_at', endOfDay.toISOString())
        .order('created_at', { ascending: true });
      
      if (!sameDayOrders || sameDayOrders.length === 0) {
        // Fallback to old format if we can't fetch
        return orderId.substring(0, 8);
      }
      
      const month = orderDate.getMonth() + 1;
      const day = orderDate.getDate();
      const customerNumber = sameDayOrders.findIndex(o => o.id === orderId) + 1;
      
      return `${month}m${day}d-${customerNumber}`;
    } catch (error) {
      console.error('Error generating readable order ID:', error);
      // Fallback to old format on error
      return orderId.substring(0, 8);
    }
  };

  // Generate order details message (reusable for both link and copy)
  const generateOrderDetails = async (orderId: string, orderCreatedAt: string) => {
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
    
    // Build message with proper line breaks - each section on a new line
    const parts: string[] = [];
    const finalTotal = totalPrice + deliveryFee;
    
    // Add order number at the beginning (readable format)
    if (orderId) {
      const readableOrderId = await generateReadableOrderId(orderId, orderCreatedAt);
      parts.push(`Order #${readableOrderId}`);
      parts.push(''); // Empty line after order number
    }
    
    // Date and time
    parts.push(dateTimeDisplay);
    parts.push(''); // Empty line after date/time
    
    // Address section
    if (completeAddress) {
      parts.push(completeAddress);
      parts.push(''); // Empty line after address
    }
    if (landmarkInfo) {
      parts.push(landmarkInfo);
      parts.push(''); // Empty line after landmark
    }
    
    // City
    if (city) {
      parts.push(city);
      parts.push(''); // Empty line after city
    }
    
    // Customer name
    if (customerName) {
      parts.push(customerName);
      parts.push(''); // Empty line after customer name
    }
    
    // Contact numbers
    parts.push(formatContactNumber(contactNumber));
    parts.push(''); // Empty line after first contact number
    if (contactNumber2) {
      parts.push(formatContactNumber(contactNumber2));
      parts.push(''); // Empty line after second contact number
    }
    
    // Order items - each item on its own line
    const itemLines = orderItemsText.split('\n').filter(line => line.trim());
    itemLines.forEach(line => {
      parts.push(line);
    });
    parts.push(''); // Empty line after items
    
    // Payment info - build with proper formatting
    if (paymentType === 'down-payment') {
      const remainingBalance = finalTotal - downPaymentAmount;
      // Add items total
      parts.push(formatPrice(totalPrice));
      parts.push(''); // Empty line after items total
      // Add delivery fee if applicable
      if (serviceType === 'delivery' && deliveryFee > 0) {
        parts.push(`${formatPrice(deliveryFee)} Delivery Fee`);
        parts.push(''); // Empty line after delivery fee
      }
      // Add down payment line
      parts.push(`${formatPrice(finalTotal)}-${formatPrice(downPaymentAmount)} DP`);
      parts.push(''); // Empty line between down payment and remaining balance
      // Add remaining balance
      parts.push(`${formatPrice(remainingBalance)} Bal. ${paymentMethodName}`);
    } else {
      // Full payment format
      parts.push(formatPrice(totalPrice));
      parts.push(''); // Empty line after items total
      // Add delivery fee if applicable
      if (serviceType === 'delivery' && deliveryFee > 0) {
        parts.push(`${formatPrice(deliveryFee)} Delivery Fee`);
        parts.push(''); // Empty line after delivery fee
      }
      // Add total with payment method
      parts.push(`${formatPrice(finalTotal)} ${paymentMethodName}`);
    }
    
    // Add "FULLPAYMENT" at the end if payment type is full payment
    if (paymentType === 'full-payment') {
      parts.push(''); // Empty line before FULLPAYMENT
      parts.push('FULLPAYMENT');
    }
    
    return parts.join('\n');
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
      total: totalWithDeliveryFee,
      deliveryFee: serviceType === 'delivery' ? deliveryFee : undefined,
      items: cartItems,
      ipAddress,
    });

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

    return order;
  };

  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptOrderDetails, setReceiptOrderDetails] = useState<string>('');
  const [showDuplicateError, setShowDuplicateError] = useState(false);
  const [duplicateOrderNumber, setDuplicateOrderNumber] = useState<string | null>(null);
  const [unavailableItems, setUnavailableItems] = useState<string[]>([]);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const lastCheckedRef = useRef<string>(''); // Track last checked date+items combination

  // Keep ref updated with latest function
  React.useEffect(() => {
    getAvailabilityForDateRef.current = getAvailabilityForDate;
  }, [getAvailabilityForDate]);

  const handlePlaceOrder = async () => {
    if (orderSaved) {
      alert('This order has already been saved. Please do not submit duplicate orders.');
      return;
    }

    // Final validation check - prevent order if unavailable items exist
    if (unavailableItems.length > 0) {
      alert(`Cannot place order: Some items are not available on the selected date:\n\n${unavailableItems.join('\n')}\n\nPlease remove these items or select a different date.`);
      return;
    }

    // Double-check validation
    if (!isDetailsValid) {
      alert('Please fill in all required fields before placing the order.');
      return;
    }

    try {
      setIsSubmitting(true);

      // Save order to database and get order
      const order = await saveOrderToDatabase();

      // Generate order details for receipt (with readable order ID)
      const orderDetails = await generateOrderDetails(order.id, order.created_at);
      
      // Store order details for receipt view
      setReceiptOrderDetails(orderDetails);
      
      // Show receipt
      setShowReceipt(true);
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

  const handleCloseReceipt = () => {
    setShowReceipt(false);
    // Redirect to home after closing receipt
    window.location.href = '/';
  };

  const isDeliveryMinimumMet = serviceType !== 'delivery' || totalPrice >= MINIMUM_DELIVERY_AMOUNT;
  
  const isDetailsValid = customerName && contactNumber && 
    (serviceType !== 'delivery' || (address && city && deliveryDate && deliveryTime)) && 
    (serviceType !== 'pickup' || (pickupDate && pickupTime)) &&
    isDeliveryMinimumMet &&
    unavailableItems.length === 0; // Items must be available for selected date

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
            
            <div className="border-t border-rca-green/20 pt-4 space-y-2">
              {serviceType === 'delivery' && deliveryFee > 0 && (
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Delivery Fee:</span>
                  <span>₱{deliveryFee.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-2xl font-playfair font-semibold text-rca-green">
                <span>Total:</span>
                <span className="text-rca-red">₱{totalWithDeliveryFee.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
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
                      {CITIES.map((c) => {
                        const fee = deliveryFees[c] || 0;
                        const feeText = fee > 0 ? ` (₱${fee.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})` : ' (Free)';
                        return (
                          <option key={c} value={c}>{c}{feeText}</option>
                        );
                      })}
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

              {/* Show unavailable items message */}
              {unavailableItems.length > 0 && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm font-medium text-red-800 mb-2">
                    ⚠️ Some items are not available on the selected date:
                  </p>
                  <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                    {unavailableItems.map((itemName, index) => (
                      <li key={index}>{itemName}</li>
                    ))}
                  </ul>
                  <p className="text-sm text-red-600 mt-2">
                    Please remove these items or select a different date to proceed.
                  </p>
                </div>
              )}

              <div className="pb-4 sm:pb-0">
                <button
                  onClick={handleProceedToPayment}
                  disabled={!isDetailsValid || isCheckingAvailability}
                  className={`w-full py-4 rounded-xl font-medium text-lg transition-all duration-200 transform ${
                    isDetailsValid && !isCheckingAvailability
                      ? 'bg-rca-red text-white hover:bg-rca-red-dark hover:scale-[1.02]'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isCheckingAvailability 
                    ? 'Checking availability...' 
                    : unavailableItems.length > 0 
                      ? 'Item(s) not available on selected date' 
                      : 'Proceed to Payment'}
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
                  const minDownPayment = 500 + deliveryFee; // Include delivery fee in minimum
                  if (downPaymentAmount < minDownPayment) {
                    setDownPaymentAmount(minDownPayment);
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
                    <span className="font-medium">Note:</span> Down payment is required for COD orders.
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
                  const minDownPayment = 500 + deliveryFee; // Include delivery fee in minimum
                  if (downPaymentAmount < minDownPayment) {
                    setDownPaymentAmount(minDownPayment);
                  } else if (downPaymentAmount > totalWithDeliveryFee) {
                    setDownPaymentAmount(totalWithDeliveryFee);
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

            {/* Delivery Fee Display */}
            {serviceType === 'delivery' && deliveryFee > 0 && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-yellow-800">Delivery Fee:</span>
                  <span className="text-sm font-semibold text-yellow-900">
                    ₱{deliveryFee.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                {paymentType === 'down-payment' && (
                  <p className="text-sm text-yellow-800 mt-1">
                    <span className="font-medium">Note:</span> Delivery fee must be included in the down payment amount.
                  </p>
                )}
              </div>
            )}

            {/* Down Payment Amount Input */}
            {paymentType === 'down-payment' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-rca-green mb-2">
                  Down Payment Amount * (Minimum ₱{500 + deliveryFee})
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
                    const minDownPayment = 500 + deliveryFee; // Minimum includes delivery fee
                    
                    // Only cap at maximum, don't auto-set minimum while typing
                    if (numValue > totalWithDeliveryFee) {
                      setDownPaymentAmount(totalWithDeliveryFee);
                    } else {
                      setDownPaymentAmount(numValue);
                    }
                  }}
                  onBlur={() => {
                    // Validate on blur - ensure minimum (including delivery fee) is met
                    const minDownPayment = 500 + deliveryFee;
                    if (downPaymentAmount < minDownPayment || downPaymentAmount === 0) {
                      setDownPaymentAmount(minDownPayment);
                    }
                  }}
                  className="w-full px-4 py-3 border border-rca-green/20 rounded-lg focus:ring-2 focus:ring-rca-red focus:border-rca-red transition-all duration-200 bg-rca-off-white"
                  placeholder={`Enter amount (minimum ₱${500 + deliveryFee})`}
                  required
                />
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-gray-600">
                    Items total: ₱{totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  {serviceType === 'delivery' && deliveryFee > 0 && (
                    <p className="text-xs text-gray-600">
                      Delivery fee: ₱{deliveryFee.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  )}
                  <p className="text-xs text-gray-600">
                    Total: ₱{totalWithDeliveryFee.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs font-medium text-rca-green mt-2">
                    Remaining balance: ₱{(totalWithDeliveryFee - downPaymentAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            )}

            {/* Full Payment Display */}
            {paymentType === 'full-payment' && (
              <div className="mb-4 p-4 bg-rca-green/5 rounded-lg border border-rca-green/20 space-y-2">
                {serviceType === 'delivery' && deliveryFee > 0 && (
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Delivery Fee:</span>
                    <span>₱{deliveryFee.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-rca-green">Full Payment Amount:</span>
                  <span className="text-xl font-bold text-rca-red">₱{totalWithDeliveryFee.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
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
                    Amount: ₱{paymentType === 'down-payment' ? downPaymentAmount : totalWithDeliveryFee}
                  </p>
                  {paymentType === 'down-payment' && (
                    <p className="text-sm text-gray-600 mt-1">
                      Remaining: ₱{totalWithDeliveryFee - downPaymentAmount}
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
              {serviceType === 'delivery' && deliveryFee > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Delivery Fee:</span>
                  <span className="text-sm font-semibold text-gray-700">
                    ₱{deliveryFee.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Payment Amount:</span>
                <span className="text-lg font-semibold text-cafe-accent">
                  ₱{paymentType === 'down-payment' ? downPaymentAmount : totalWithDeliveryFee}
                </span>
              </div>
              {paymentType === 'down-payment' && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Remaining Balance:</span>
                  <span className="text-sm font-semibold text-gray-700">
                    ₱{totalWithDeliveryFee - downPaymentAmount}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between text-2xl font-playfair font-semibold text-cafe-dark border-t border-cafe-latte pt-4">
              <span>Total Amount:</span>
              <span className="text-cafe-accent">₱{totalWithDeliveryFee.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>

          {/* Place Order Button */}
          <button
            onClick={handlePlaceOrder}
            disabled={isSubmitting || orderSaved}
            className="w-full py-4 rounded-xl font-medium text-lg transition-all duration-200 transform bg-cafe-accent text-white hover:bg-cafe-espresso hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {orderSaved ? 'Order Already Saved' : isSubmitting ? 'Saving Order...' : 'Generate Receipt'}
          </button>
          
          <p className="text-xs text-gray-500 text-center mt-3">
            Your order will be saved and a receipt will be generated for your records.
          </p>
        </div>
      </div>

      {/* Receipt View */}
      {showReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 my-8 transform transition-all">
            <div className="p-6 border-t-4 border-rca-green">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-playfair font-semibold text-rca-green mb-4">ORDER RECEIPT</h2>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-800 font-medium">
                    📸 Please take a screenshot of this receipt for your records
                  </p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800 leading-relaxed">
                  {receiptOrderDetails}
                </pre>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 rounded-b-xl flex items-center justify-end">
              <button
                onClick={handleCloseReceipt}
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