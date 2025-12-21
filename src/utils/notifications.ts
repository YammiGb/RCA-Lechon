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
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Mobile browsers are very strict - start with minimal options
    let notificationOptions: NotificationOptions = {};
    
    if (isMobile) {
      // Mobile: Use only the most basic, widely-supported options
      notificationOptions = {
        body: options?.body || '',
        tag: options?.tag || 'new-order',
        // Don't include icon, badge, or requireInteraction on mobile - they often cause failures
      };
      
      console.log('Mobile: Creating notification with minimal options:', notificationOptions);
      
      // Try with minimal options first
      try {
        const notification = new Notification(title, notificationOptions);
        console.log('✅ Mobile notification created successfully with minimal options');
        
        // Set up handlers
        setupNotificationHandlers(notification, isMobile);
        return notification;
      } catch (minimalError) {
        console.warn('Minimal options failed, trying title-only:', minimalError);
        
        // Last resort: title only
        try {
          const titleOnlyNotification = new Notification(title);
          console.log('✅ Mobile notification created with title only');
          setupNotificationHandlers(titleOnlyNotification, isMobile);
          return titleOnlyNotification;
        } catch (titleOnlyError) {
          console.error('❌ Even title-only notification failed:', titleOnlyError);
          throw titleOnlyError; // Re-throw to trigger fallback alert
        }
      }
    } else {
      // Desktop: Can use more options
      notificationOptions = {
        body: options?.body || '',
        icon: options?.icon || '/logo.jpg',
        badge: options?.badge || '/logo.jpg',
        tag: options?.tag || 'new-order',
        requireInteraction: options?.requireInteraction || false,
        silent: options?.silent || false,
      };
      
      console.log('Desktop: Creating notification with full options:', notificationOptions);
      const notification = new Notification(title, notificationOptions);
      setupNotificationHandlers(notification, isMobile);
      return notification;
    }
  } catch (error) {
    console.error('❌ Error creating notification:', error);
    console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    return null;
  }
};

// Helper function to set up notification handlers
function setupNotificationHandlers(notification: Notification, isMobile: boolean) {
  // Auto-close after delay (longer on mobile)
  const closeDelay = isMobile ? 10000 : 5000;
  setTimeout(() => {
    try {
      notification.close();
    } catch (e) {
      // Ignore errors when closing
    }
  }, closeDelay);

  // Handle click on notification
  notification.onclick = () => {
    try {
      window.focus();
      notification.close();
    } catch (e) {
      console.warn('Error handling notification click:', e);
    }
  };

  // Handle errors
  notification.onerror = (error) => {
    console.error('Notification error event:', error);
  };
};

/**
 * Show notification for new order
 */
export const notifyNewOrder = (orderNumber?: string) => {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  console.log('=== NOTIFICATION DEBUG ===');
  console.log('notifyNewOrder called with orderNumber:', orderNumber);
  console.log('Notification permission:', Notification.permission);
  console.log('Notification supported:', 'Notification' in window);
  console.log('Is iOS:', isIOS());
  console.log('Is PWA:', isPWA());
  console.log('Is Mobile:', isMobile);
  console.log('User Agent:', navigator.userAgent);
  console.log('Document visibility:', document.visibilityState);
  console.log('Window focused:', document.hasFocus());
  
  // Check if browser supports notifications
  if (!('Notification' in window)) {
    const errorMsg = 'Notifications not supported: Browser does not support Notification API';
    console.error(errorMsg);
    if (isMobile) {
      // Show alert on mobile when notifications aren't supported
      alert(`⚠️ ${errorMsg}\n\nPlease use Chrome or Firefox browser.`);
    }
    return null;
  }
  
  // iOS-specific check - iOS requires PWA for notifications
  if (isIOS() && !isPWA()) {
    const errorMsg = 'iOS notifications require PWA installation';
    console.error(errorMsg);
    console.error('Instructions: Tap Share button → Add to Home Screen');
    alert(`⚠️ ${errorMsg}\n\nPlease add the app to your home screen:\n1. Tap Share button (□↑)\n2. Select "Add to Home Screen"\n3. Open from home screen icon`);
    return null;
  }
  
  // Check permission
  if (Notification.permission !== 'granted') {
    const permissionStatus = Notification.permission;
    console.warn('Notification permission not granted:', permissionStatus);
    
    if (permissionStatus === 'default') {
      console.warn('Permission not yet requested. User needs to grant permission first.');
      if (isMobile) {
        alert('📱 Please grant notification permission when prompted.\n\nClick "Test Notification" button to request permission.');
      }
    } else if (permissionStatus === 'denied') {
      console.error('Notification permission denied. User must enable in browser settings.');
      if (isMobile) {
        alert('🔔 Notification permission denied!\n\nPlease enable notifications:\n\nAndroid: Browser Settings → Site Settings → Notifications → Allow\n\niOS: Settings → Safari → [Your Site] → Allow Notifications');
      }
    }
    return null;
  }
  
  const title = 'New Order Received!';
  const body = orderNumber 
    ? `Order #${orderNumber} has been placed`
    : 'A new order has been placed';

  try {
    // Build notification options - mobile browsers reject invalid options
    const notificationOptions: NotificationOptions = {
      body,
      tag: `order-${orderNumber || 'new'}`, // Unique tag per order to prevent duplicates
    };

    // On desktop, add icon and badge
    // On mobile, showNotification will handle options more carefully
    if (!isMobile) {
      notificationOptions.icon = '/logo.jpg';
      notificationOptions.badge = '/logo.jpg';
      notificationOptions.silent = false;
    }
    // On mobile, don't pass icon/badge - let showNotification handle it safely

    // Add vibration for mobile devices (if supported) - do this separately
    if ('vibrate' in navigator && isMobile) {
      try {
        navigator.vibrate([200, 100, 200]);
        console.log('Vibration triggered');
      } catch (vibError) {
        console.warn('Vibration failed:', vibError);
      }
    }

    console.log('Calling showNotification with options:', notificationOptions);
    const result = showNotification(title, notificationOptions);
    
    if (!result) {
      const errorMsg = `Failed to show notification. Permission: ${Notification.permission}`;
      console.warn(errorMsg);
      if (isMobile) {
        // Fallback: Show alert on mobile if notification fails
        alert(`🔔 ${title}\n\n${body}\n\n(Notification API failed, showing alert instead)`);
      }
    } else {
      console.log('✅ Notification shown successfully');
      // Also log to help debug mobile issues
      if (isMobile) {
        console.log('Mobile notification displayed. If you don\'t see it:');
        console.log('1. Check notification tray/center');
        console.log('2. Check browser notification settings');
        console.log('3. Check phone Do Not Disturb settings');
      }
    }
    
    return result;
  } catch (error) {
    const errorDetails = error instanceof Error ? error.message : String(error);
    console.error('❌ Error showing notification:', error);
    console.error('Error details:', errorDetails);
    
    // Fallback alert on mobile
    if (isMobile) {
      alert(`🔔 ${title}\n\n${body}\n\n(Error: ${errorDetails})`);
    }
    
    return null;
  }
};

