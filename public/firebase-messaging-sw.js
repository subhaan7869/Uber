// firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker.
// These details match your firebase-applet-config.json.
firebase.initializeApp({
  apiKey: "AIzaSyDen5HiEAELwzKILcHjocAr0VlliOSn6xs",
  authDomain: "gen-lang-client-0212832597.firebaseapp.com",
  projectId: "gen-lang-client-0212832597",
  storageBucket: "gen-lang-client-0212832597.firebasestorage.app",
  messagingSenderId: "990217085077",
  appId: "1:990217085077:web:5eabf1aed58dc8e0f47b9c"
});

const messaging = firebase.messaging();

// Background message handler
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  // Parse custom parameters from the notification payload
  const title = payload.notification?.title || payload.data?.title || 'New Delivery Available 🍔';
  const body = payload.notification?.body || payload.data?.body || 'McBurger • £8.50 • 2.3 miles away';
  const orderId = payload.data?.orderId || '';

  const notificationOptions = {
    body: body,
    icon: '/icon.png', // Main game icon
    badge: '/icon.png', // Small badge icon shown in Android status bar
    vibrate: [200, 100, 200, 100, 200],
    tag: orderId || 'new-order',
    renotify: true,
    data: {
      url: '/',
      orderId: orderId
    },
    // Adding custom push action buttons to let drivers accept or decline straight from their drawer / notification bar!
    actions: [
      { action: 'accept', title: 'Accept ✅' },
      { action: 'decline', title: 'Decline ❌' }
    ]
  };

  return self.registration.showNotification(title, notificationOptions);
});

// Deep-linking / tap handling: custom action button handling
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification clicked. Action:', event.action);
  event.notification.close();

  const orderId = event.notification.data?.orderId || '';
  let targetUrl = '/';

  // Construct query parameters so the frontend knows what to do when deep-linked
  if (event.action === 'accept') {
    targetUrl = `/?action=accept&orderId=${orderId}`;
  } else if (event.action === 'decline') {
    targetUrl = `/?action=decline&orderId=${orderId}`;
  } else {
    // Normal tap on notification body (no action button)
    targetUrl = `/?action=view&orderId=${orderId}`;
  }

  const absoluteUrl = new URL(targetUrl, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // 1. Check if there is already a window open with our app
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        
        // If the window is open, send a reactive postMessage to instantly focus and handle the action
        if ('focus' in client) {
          client.postMessage({
            type: 'NOTIFICATION_CALLBACK',
            action: event.action || 'view',
            orderId: orderId
          });
          
          // Let client navigate or update state directly
          client.navigate(absoluteUrl);
          return client.focus();
        }
      }
      
      // 2. If no window is open, open a new standalone PWA window
      if (clients.openWindow) {
        return clients.openWindow(absoluteUrl);
      }
    })
  );
});
