export interface Variation {
  id: string;
  name: string;
  price: number;
}

export interface AddOn {
  id: string;
  name: string;
  price: number;
  category: string;
  quantity?: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  category: string;
  image?: string;
  popular?: boolean;
  available?: boolean;
  variations?: Variation[];
  addOns?: AddOn[];
  // Discount pricing fields
  discountPrice?: number;
  discountStartDate?: string;
  discountEndDate?: string;
  discountActive?: boolean;
  // Computed effective price (calculated in the app)
  effectivePrice?: number;
  isOnDiscount?: boolean;
}

export interface CartItem extends MenuItem {
  quantity: number;
  selectedVariation?: Variation;
  selectedAddOns?: AddOn[];
  totalPrice: number;
}

export interface OrderData {
  items: CartItem[];
  customerName: string;
  contactNumber: string;
  serviceType: 'dine-in' | 'pickup' | 'delivery';
  address?: string;
  pickupTime?: string;
  // Dine-in specific fields
  partySize?: number;
  dineInTime?: string;
  paymentMethod: 'gcash' | 'maya' | 'bank-transfer';
  paymentType?: 'down-payment' | 'full-payment';
  downPaymentAmount?: number;
  referenceNumber?: string;
  total: number;
  notes?: string;
}

export type PaymentMethod = 'gcash' | 'maya' | 'bank-transfer';
export type ServiceType = 'dine-in' | 'pickup' | 'delivery';

// Site Settings Types
export interface SiteSetting {
  id: string;
  value: string;
  type: 'text' | 'image' | 'boolean' | 'number';
  description?: string;
  updated_at: string;
}

export interface SiteSettings {
  site_name: string;
  site_logo: string;
  site_description: string;
  currency: string;
  currency_code: string;
  delivery_enabled: string; // 'true' or 'false' as string (stored in DB)
}

// Order Types
export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  name: string;
  variation?: Variation | null;
  add_ons?: AddOn[] | null;
  unit_price: number;
  quantity: number;
  subtotal: number;
  created_at: string;
}

export interface Order {
  id: string;
  customer_name: string;
  contact_number: string;
  contact_number2?: string | null;
  service_type: 'dine-in' | 'pickup' | 'delivery';
  address?: string | null;
  landmark?: string | null;
  city?: string | null;
  pickup_date?: string | null;
  pickup_time?: string | null;
  delivery_date?: string | null;
  delivery_time?: string | null;
  dine_in_time?: string | null;
  payment_method: string;
  payment_type?: 'down-payment' | 'full-payment' | null;
  down_payment_amount?: number | null;
  reference_number?: string | null;
  notes?: string | null;
  total: number;
  status: 'pending' | 'approved' | 'rejected' | 'synced';
  verified_by?: string | null;
  verified_at?: string | null;
  synced_to_sheets: boolean;
  synced_at?: string | null;
  ip_address?: string | null;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
}