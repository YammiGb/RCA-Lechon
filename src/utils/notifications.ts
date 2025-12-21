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
    console.warn('Notification permission not granted:', Notification.permission);
    return null;
  }

  // Double-check Notification constructor is available
  if (typeof Notification === 'undefined') {
    console.error('Notification constructor is undefined!');
    return null;
  }

  // Check if we're in a secure context (required for notifications)
  if (!window.isSecureContext) {
    console.error('Not in secure context (HTTPS required for notifications)');
    return null;
  }

  try {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Mobile browsers are very strict - start with minimal options
    let notificationOptions: NotificationOptions = {};
    
    if (isMobile) {
      // Mobile: Try multiple fallback strategies
      // Some mobile browsers reject ANY options, even empty ones
      
      // Strategy 1: Try with just body (no tag, no other options)
      // Only if body is not empty
      if (options?.body && options.body.trim().length > 0) {
        try {
          console.log('Mobile Strategy 1: Attempting notification with body only');
          console.log('Title:', title);
          console.log('Body:', options.body);
          const notification = new Notification(title, { body: options.body });
          console.log('✅ Mobile notification created successfully with body only');
          setupNotificationHandlers(notification, isMobile);
          return notification;
        } catch (bodyError) {
          console.warn('❌ Strategy 1 (body only) failed:', bodyError);
          console.warn('Error message:', bodyError instanceof Error ? bodyError.message : String(bodyError));
        }
      }
      
      // Strategy 2: Try title only (no options at all)
      try {
        console.log('Mobile Strategy 2: Attempting notification with title only (no options)');
        console.log('Title:', title);
        const titleOnlyNotification = new Notification(title);
        console.log('✅ Mobile notification created successfully with title only');
        setupNotificationHandlers(titleOnlyNotification, isMobile);
        return titleOnlyNotification;
      } catch (titleOnlyError) {
        console.error('❌ Strategy 2 (title only) also failed:', titleOnlyError);
        console.error('Error type:', titleOnlyError instanceof Error ? titleOnlyError.constructor.name : typeof titleOnlyError);
        console.error('Error message:', titleOnlyError instanceof Error ? titleOnlyError.message : String(titleOnlyError));
        console.error('Error name:', titleOnlyError instanceof Error ? titleOnlyError.name : 'Unknown');
        
        // Additional diagnostics
        console.error('Diagnostics:');
        console.error('- Notification constructor type:', typeof Notification);
        console.error('- Notification.permission:', Notification.permission);
        console.error('- window.isSecureContext:', window.isSecureContext);
        console.error('- User Agent:', navigator.userAgent);
        
        throw titleOnlyError; // Re-throw to trigger fallback alert
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

// Queue for notifications when page is hidden
let notificationQueue: Array<{ title: string; body: string; orderNumber?: string }> = [];

// Handle page visibility changes - show queued notifications when page becomes visible
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && notificationQueue.length > 0) {
      console.log('Page became visible, showing queued notifications:', notificationQueue.length);
      const queued = notificationQueue.shift();
      if (queued) {
        // Small delay to ensure page is fully visible
        setTimeout(() => {
          showNotificationDirectly(queued.title, { body: queued.body }, queued.orderNumber);
        }, 500);
      }
    }
  });
}

/**
 * Show notification directly (internal function)
 */
function showNotificationDirectly(title: string, options: NotificationOptions, orderNumber?: string) {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  try {
    if (isMobile) {
      // Mobile: Try multiple fallback strategies
      if (options.body && options.body.trim().length > 0) {
        try {
          console.log('Mobile: Attempting notification with body only');
          const notification = new Notification(title, { body: options.body });
          console.log('✅ Mobile notification created with body only');
          setupNotificationHandlers(notification, isMobile);
          return notification;
        } catch (bodyError) {
          console.warn('Body-only notification failed:', bodyError);
        }
      }
      
      // Try title only
      try {
        console.log('Mobile: Attempting notification with title only');
        const titleOnlyNotification = new Notification(title);
        console.log('✅ Mobile notification created with title only');
        setupNotificationHandlers(titleOnlyNotification, isMobile);
        return titleOnlyNotification;
      } catch (titleOnlyError) {
        console.error('❌ Title-only notification failed:', titleOnlyError);
        throw titleOnlyError;
      }
    } else {
      // Desktop: Use full options
      const notification = new Notification(title, options);
      setupNotificationHandlers(notification, isMobile);
      return notification;
    }
  } catch (error) {
    console.error('❌ Error creating notification:', error);
    throw error;
  }
}

/**
 * Show notification via Service Worker (works in background)
 */
async function showNotificationViaServiceWorker(title: string, body: string, orderNumber?: string) {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    try {
      // Send message to service worker
      navigator.serviceWorker.controller.postMessage({
        type: 'SHOW_NOTIFICATION',
        title,
        body,
        orderNumber
      });
      console.log('✅ Notification sent to Service Worker (works in background)');
      return true;
    } catch (error) {
      console.error('Failed to send notification to Service Worker:', error);
      return false;
    }
  }
  return false;
}

/**
 * Show notification for new order
 */
export const notifyNewOrder = async (orderNumber?: string) => {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  console.log('=== NOTIFICATION DEBUG ===');
  console.log('notifyNewOrder called with orderNumber:', orderNumber);
  console.log('Notification permission:', Notification.permission);
  console.log('Service Worker available:', 'serviceWorker' in navigator);
  console.log('Service Worker controller:', navigator.serviceWorker?.controller ? 'Yes' : 'No');
  console.log('Is iOS:', isIOS());
  console.log('Is PWA:', isPWA());
  console.log('Is Mobile:', isMobile);
  console.log('Document visibility:', document.visibilityState);
  console.log('Page hidden:', document.hidden);
  
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

  // Try Service Worker first (works in background like Facebook)
  if ('serviceWorker' in navigator) {
    // Wait for service worker to be ready
    try {
      const registration = await navigator.serviceWorker.ready;
      if (registration.active) {
        console.log('Service Worker is active, using it for notification');
        const success = await showNotificationViaServiceWorker(title, body, orderNumber);
        if (success) {
          console.log('✅ Notification sent via Service Worker (works even in background)');
          return {} as Notification; // Return dummy object
        }
      }
    } catch (swError) {
      console.warn('Service Worker not ready, falling back to regular notification:', swError);
    }
  }

  // Fallback to regular Notification API if Service Worker fails
  console.log('Falling back to regular Notification API');
  
  try {
    // Build notification options
    const notificationOptions: NotificationOptions = {
      body,
      tag: `order-${orderNumber || 'new'}`,
    };

    // On desktop, add icon and badge
    if (!isMobile) {
      notificationOptions.icon = '/logo.jpg';
      notificationOptions.badge = '/logo.jpg';
      notificationOptions.silent = false;
    }

    // Add vibration for mobile devices
    if ('vibrate' in navigator && isMobile) {
      try {
        navigator.vibrate([200, 100, 200]);
        console.log('Vibration triggered');
      } catch (vibError) {
        console.warn('Vibration failed:', vibError);
      }
    }

    console.log('Attempting to show notification with options:', notificationOptions);
    const result = showNotificationDirectly(title, notificationOptions, orderNumber);
    
    if (!result) {
      console.warn('Regular notification also failed');
      if (isMobile) {
        alert(`🔔 ${title}\n\n${body}`);
      }
    } else {
      console.log('✅ Notification shown via regular API');
    }
    
    return result;
  } catch (error) {
    const errorDetails = error instanceof Error ? error.message : String(error);
    console.error('❌ Error showing notification:', error);
    
    // Final fallback: alert
    if (isMobile) {
      alert(`🔔 ${title}\n\n${body}`);
    }
    
    return null;
  }
};

