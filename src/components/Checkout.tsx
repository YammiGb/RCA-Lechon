import React, { useState } from 'react';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { CartItem, PaymentMethod, ServiceType } from '../types';
import { usePaymentMethods } from '../hooks/usePaymentMethods';
import { useSiteSettings } from '../hooks/useSiteSettings';

interface CheckoutProps {
  cartItems: CartItem[];
  totalPrice: number;
  onBack: () => void;
}

const MINIMUM_DELIVERY_AMOUNT = 150;

const Checkout: React.FC<CheckoutProps> = ({ cartItems, totalPrice, onBack }) => {
  const { paymentMethods } = usePaymentMethods();
  const { siteSettings } = useSiteSettings();
  const [step, setStep] = useState<'details' | 'payment'>('details');
  const [customerName, setCustomerName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [serviceType, setServiceType] = useState<ServiceType>('pickup');
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('Lapu-Lapu City');
  const [pickupDate, setPickupDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [pickupTime, setPickupTime] = useState('12:00');
  const [deliveryDate, setDeliveryDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [deliveryTime, setDeliveryTime] = useState('12:00');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('gcash');

  const SHOP_ADDRESS = 'Gabi Road, Cordova, Lapu-Lapu City';
  const CITIES = ['Lapu-Lapu City', 'Cebu City', 'Mandaue City', 'Talisay', 'Minglanilla', 'Consolacion', 'Liloan'];

  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  // Build effective payment methods list including Cash (Onsite)
  const cashMethod = {
    id: 'cash',
    name: 'Cash (Onsite)',
    account_number: '',
    account_name: '',
    qr_code_url: '',
    active: true,
    sort_order: 999,
    created_at: '',
    updated_at: ''
  } as any;
  const effectivePaymentMethods = [...paymentMethods, cashMethod];

  // Set default payment method when payment methods are loaded
  React.useEffect(() => {
    if (effectivePaymentMethods.length > 0 && !paymentMethod) {
      setPaymentMethod((effectivePaymentMethods[0].id as PaymentMethod) || 'cash');
    }
  }, [effectivePaymentMethods, paymentMethod]);

  const selectedPaymentMethod = effectivePaymentMethods.find(method => method.id === paymentMethod);
  
  // Check if delivery is enabled
  const isDeliveryEnabled = siteSettings?.delivery_enabled === 'true';

  const handleProceedToPayment = () => {
    setStep('payment');
  };

  const handlePlaceOrder = () => {
    const completeAddress = serviceType === 'delivery' ? `${address}` : SHOP_ADDRESS;
    const landmarkInfo = serviceType === 'delivery' ? landmark : '';

    const formatTimeWithAMPM = (timeString: string) => {
      const [hours, minutes] = timeString.split(':').map(Number);
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    };

    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    const dateTimeDisplay = serviceType === 'pickup'
      ? `${formatDate(pickupDate)} at ${formatTimeWithAMPM(pickupTime)}`
      : `${formatDate(deliveryDate)} at ${formatTimeWithAMPM(deliveryTime)}`;

    const orderDetails = `
Date & Time: ${dateTimeDisplay}

Complete Address: ${completeAddress}
${landmarkInfo ? `\nLandmark: ${landmarkInfo}` : ''}

Full Name: ${customerName}

Mobile No 1: ${contactNumber}
Mobile No 2: 

Order Details: 
${cartItems.map(item => {
  let itemDetails = `${item.name}`;
  if (item.selectedVariation) {
    itemDetails += ` (${item.selectedVariation.name})`;
  }
  if (item.selectedAddOns && item.selectedAddOns.length > 0) {
    itemDetails += ` + ${item.selectedAddOns.map(addOn => 
      addOn.quantity && addOn.quantity > 1 
        ? `${addOn.name} x${addOn.quantity}`
        : addOn.name
    ).join(', ')}`;
  }
  itemDetails += ` x${item.quantity} - ₱${item.totalPrice * item.quantity}`;
  return itemDetails;
}).join('\n')}

Total Amount: ₱${totalPrice}

Service Type: ${serviceType.charAt(0).toUpperCase() + serviceType.slice(1)}
${serviceType === 'delivery' ? `City: ${city}` : ''}
Payment Method: ${selectedPaymentMethod?.name || paymentMethod}
${paymentMethod === 'cash' ? '' : 'Payment Screenshot: Please attach your payment receipt screenshot'}
    `.trim();

    const encodedMessage = encodeURIComponent(orderDetails);
    const messengerUrl = `https://m.me/RCALechonBellyAndBilao?text=${encodedMessage}`;
    
    window.open(messengerUrl, '_blank');
    
  };

  const isDeliveryMinimumMet = serviceType !== 'delivery' || totalPrice >= MINIMUM_DELIVERY_AMOUNT;
  
  const isDetailsValid = customerName && contactNumber && 
    (serviceType !== 'delivery' || (address && city && deliveryDate && deliveryTime)) && 
    (serviceType !== 'pickup' || (pickupDate && pickupTime)) &&
    isDeliveryMinimumMet;

  if (step === 'details') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
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
                <label className="block text-sm font-medium text-rca-green mb-2">Contact Number *</label>
                <input
                  type="tel"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  className="w-full px-4 py-3 border border-rca-green/20 rounded-lg focus:ring-2 focus:ring-rca-red focus:border-rca-red transition-all duration-200 bg-rca-off-white"
                  placeholder="09XX XXX XXXX"
                  required
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
                    <input
                      type="time"
                      aria-label="Pickup Time"
                      value={pickupTime}
                      onChange={(e) => {
                        const time = e.target.value;
                        const [hours] = time.split(':').map(Number);
                        if (hours < 20) {
                          setPickupTime(time);
                        }
                      }}
                      className="w-full px-4 py-3 border border-rca-green/20 rounded-lg focus:ring-2 focus:ring-rca-red focus:border-rca-red transition-all duration-200 bg-rca-off-white"
                      max="19:59"
                      required
                    />
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
                    <p className="text-sm text-rca-text-light mb-3">Delivery hours: 9:00 AM - 8:00 PM</p>
                    <input
                      type="time"
                      aria-label="Delivery Time"
                      value={deliveryTime}
                      onChange={(e) => {
                        const time = e.target.value;
                        const [hours] = time.split(':').map(Number);
                        if (hours >= 9 && hours < 20) {
                          setDeliveryTime(time);
                        }
                      }}
                      className="w-full px-4 py-3 border border-rca-green/20 rounded-lg focus:ring-2 focus:ring-rca-red focus:border-rca-red transition-all duration-200 bg-rca-off-white"
                      min="09:00"
                      max="19:59"
                      required
                    />
                  </div>
                </>
              )}

              {/* City Selection - for both pickup and delivery */}
              {(serviceType === 'pickup' || serviceType === 'delivery') && (
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
              )}

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
          <h2 className="text-2xl font-playfair font-medium text-rca-green mb-6">Choose Payment Method</h2>
          
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
                <span className="text-2xl">{method.id === 'cash' ? '💵' : '💳'}</span>
                <span className="font-medium">{method.name}</span>
              </button>
            ))}
          </div>

          {/* Payment Details with QR Code (hide for cash) */}
          {selectedPaymentMethod && paymentMethod !== 'cash' && (
            <div className="bg-rca-off-white rounded-lg p-6 mb-6 border border-rca-green/20">
              <h3 className="font-medium text-rca-green mb-4">Payment Details</h3>
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-1">{selectedPaymentMethod.name}</p>
                  <p className="font-mono text-cafe-dark font-medium">{selectedPaymentMethod.account_number}</p>
                  <p className="text-sm text-gray-600 mb-3">Account Name: {selectedPaymentMethod.account_name}</p>
                  <p className="text-xl font-semibold text-cafe-accent">Amount: ₱{totalPrice}</p>
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

          {/* Payment instructions: show proof section only for non-cash */}
          {paymentMethod !== 'cash' ? (
            <div className="bg-cafe-cream border border-cafe-latte rounded-lg p-4">
              <h4 className="font-medium text-cafe-dark mb-2">📸 Payment Proof Required</h4>
              <p className="text-sm text-gray-700">
                After making your payment, please take a screenshot of your payment receipt and attach it when you send your order via Messenger. This helps us verify and process your order quickly.
              </p>
            </div>
          ) : (
            <div className="bg-cafe-cream border border-cafe-latte rounded-lg p-4">
              <h4 className="font-medium text-cafe-dark mb-2">💵 Pay with Cash Onsite</h4>
              <p className="text-sm text-gray-700">
                Please proceed to the counter and pay in cash when you arrive. No payment screenshot needed.
              </p>
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div className="bg-cafe-light rounded-xl shadow-sm p-6 border border-cafe-latte">
          <h2 className="text-2xl font-playfair font-medium text-cafe-dark mb-6">Final Order Summary</h2>
          
          <div className="space-y-4 mb-6">
            <div className="bg-cafe-beige rounded-lg p-4 border border-cafe-latte">
              <h4 className="font-medium text-cafe-dark mb-2">Customer Details</h4>
              <p className="text-sm text-gray-600">Name: {customerName}</p>
              <p className="text-sm text-gray-600">Contact: {contactNumber}</p>
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
          
          <div className="border-t border-cafe-latte pt-4 mb-6">
            <div className="flex items-center justify-between text-2xl font-playfair font-semibold text-cafe-dark">
              <span>Total:</span>
              <span className="text-cafe-accent">₱{totalPrice}</span>
            </div>
          </div>

          <button
            onClick={handlePlaceOrder}
            className="w-full py-4 rounded-xl font-medium text-lg transition-all duration-200 transform bg-cafe-accent text-white hover:bg-cafe-espresso hover:scale-[1.02]"
          >
            Place Order via Messenger
          </button>
          
          <p className="text-xs text-gray-500 text-center mt-3">
            You'll be redirected to Facebook Messenger to confirm your order. Don't forget to attach your payment screenshot!
          </p>
        </div>
      </div>
    </div>
  );
};

export default Checkout;