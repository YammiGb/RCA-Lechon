// Service Worker for background notifications
// This allows notifications to work even when the page is in the background

const CACHE_NAME = 'just-cafe-v1';

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  self.skipWaiting(); // Activate immediately
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(self.clients.claim()); // Take control of all pages immediately
});

// Listen for messages from the main page
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data);
  
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, orderNumber } = event.data;
    showNotification(title, body, orderNumber);
  }
});

// Function to show notification
function showNotification(title, body, orderNumber) {
  const notificationOptions = {
    body: body || 'A new order has been placed',
    icon: '/logo.jpg',
    badge: '/logo.jpg',
    tag: `order-${orderNumber || 'new'}`,
    requireInteraction: false,
    silent: false,
    vibrate: [200, 100, 200], // Vibration pattern
    data: {
      orderNumber: orderNumber,
      url: '/admin?view=orders'
    }
  };

  // Remove icon/badge if they might cause issues (some mobile browsers)
  // But try with them first
  self.registration.showNotification(title, notificationOptions)
    .then(() => {
      console.log('Service Worker notification shown successfully');
    })
    .catch((error) => {
      console.error('Service Worker notification failed, trying without icon:', error);
      // Retry without icon/badge
      const minimalOptions = {
        body: notificationOptions.body,
        tag: notificationOptions.tag,
        data: notificationOptions.data
      };
      return self.registration.showNotification(title, minimalOptions);
    })
    .catch((error) => {
      console.error('Service Worker notification failed even with minimal options:', error);
    });
}

// Handle fetch requests - always use network for navigation to ensure routing works
self.addEventListener('fetch', (event) => {
  // Only handle navigation requests (document requests)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // If network fails, return cached index.html for SPA routing
          return caches.match('/index.html');
        })
    );
  }
  // For all other requests (API, images, etc.), use network-first strategy
  else {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(event.request);
      })
    );
  }
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event.notification);
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If there's already a window open, focus it
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes('/admin') && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise, open a new window
      if (clients.openWindow) {
        return clients.openWindow('/admin?view=orders');
      }
    })
  );
});

