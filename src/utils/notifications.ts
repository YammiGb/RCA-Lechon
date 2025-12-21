// Browser notification utility

const NOTIFICATION_PERMISSION_KEY = 'rca_notification_permission_requested';

/**
 * Check if device is iOS
 */
export const isIOS = (): boolean => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

/**
 * Check if app is running as PWA (installed to home screen)
 */
export const isPWA = (): boolean => {
  return window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://');
};

/**
 * Check if notifications are supported on this platform
 */
export const isNotificationSupported = (): boolean => {
  if (!('Notification' in window)) {
    return false;
  }

  // iOS requires PWA installation for notifications
  if (isIOS()) {
    return isPWA();
  }

  return true;
};

/**
 * Request notification permission from the user
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  // Check if browser supports notifications
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return false;
  }

  // iOS-specific check
  if (isIOS() && !isPWA()) {
    console.warn('iOS requires the app to be added to home screen for notifications');
    return false;
  }

  // Check if permission was already granted
  if (Notification.permission === 'granted') {
    return true;
  }

  // Check if permission was already denied
  if (Notification.permission === 'denied') {
    return false;
  }

  // Request permission
  try {
    const permission = await Notification.requestPermission();
    localStorage.setItem(NOTIFICATION_PERMISSION_KEY, 'true');
    return permission === 'granted';
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

/**
 * Show a browser notification
 */
export const showNotification = (
  title: string,
  options?: NotificationOptions
): Notification | null => {
  // Check if browser supports notifications
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return null;
  }

  // iOS-specific check
  if (isIOS() && !isPWA()) {
    console.warn('iOS requires the app to be added to home screen for notifications');
    return null;
  }

  // Check if permission is granted
  if (Notification.permission !== 'granted') {
    console.warn('Notification permission not granted');
    return null;
  }

  try {
    const notification = new Notification(title, {
      icon: '/logo.jpg',
      badge: '/logo.jpg',
      tag: options?.tag || 'new-order', // Use provided tag or default
      requireInteraction: false,
      ...options,
    });

    // Auto-close after 5 seconds
    setTimeout(() => {
      notification.close();
    }, 5000);

    // Handle click on notification
    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    return notification;
  } catch (error) {
    console.error('Error showing notification:', error);
    return null;
  }
};

/**
 * Show notification for new order
 */
export const notifyNewOrder = (orderNumber?: string) => {
  console.log('notifyNewOrder called with orderNumber:', orderNumber);
  console.log('Notification permission:', Notification.permission);
  console.log('Notification supported:', 'Notification' in window);
  console.log('Is iOS:', isIOS());
  console.log('Is PWA:', isPWA());
  console.log('User Agent:', navigator.userAgent);
  
  // Check if browser supports notifications
  if (!('Notification' in window)) {
    console.error('Notifications not supported: Browser does not support Notification API');
    return null;
  }
  
  // iOS-specific check - iOS requires PWA for notifications
  if (isIOS() && !isPWA()) {
    console.error('iOS notifications require PWA: Please add the app to home screen');
    console.error('Instructions: Tap Share button → Add to Home Screen');
    return null;
  }
  
  // Check permission
  if (Notification.permission !== 'granted') {
    console.warn('Notification permission not granted:', Notification.permission);
    if (Notification.permission === 'default') {
      console.warn('Permission not yet requested. User needs to grant permission first.');
    } else if (Notification.permission === 'denied') {
      console.error('Notification permission denied. User must enable in browser settings.');
    }
    return null;
  }
  
  const title = 'New Order Received!';
  const body = orderNumber 
    ? `Order #${orderNumber} has been placed`
    : 'A new order has been placed';

  try {
    // Use regular Notification API with mobile-optimized options
    const notificationOptions: NotificationOptions = {
      body,
      icon: '/logo.jpg',
      badge: '/logo.jpg',
      tag: `order-${orderNumber || 'new'}`, // Unique tag per order to prevent duplicates
      requireInteraction: false,
      silent: false,
    };

    // Add vibration for mobile devices (if supported)
    if ('vibrate' in navigator) {
      notificationOptions.vibrate = [200, 100, 200];
    }

    const result = showNotification(title, notificationOptions);
    
    if (!result) {
      console.warn('Failed to show notification. Permission:', Notification.permission);
    } else {
      console.log('Notification shown successfully');
    }
    
    return result;
  } catch (error) {
    console.error('Error showing notification:', error);
    console.error('Error details:', error instanceof Error ? error.message : String(error));
    return null;
  }
};

