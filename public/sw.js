self.options = {
    "domain": "5gvci.com",
    "zoneId": 11490559
}
self.lary = ""
importScripts('https://5gvci.com/act/files/service-worker.min.js?r=sw')

// Kora Football Service Worker
const CACHE_NAME = 'kora-cache-v2';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Direct message listener to allow Web App to trigger Native Mobile Push Notification
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_MOBILE_NOTIFICATION') {
    const { title, options } = event.data;
    self.registration.showNotification(title || 'كورة - Kora ⚽', {
      icon: '/pwa-192x192.png',
      badge: '/favicon-32x32.png',
      vibrate: [250, 100, 250, 100, 250],
      tag: options?.tag || `kora-alert-${Date.now()}`,
      renotify: true,
      requireInteraction: true,
      actions: [
        { action: 'predict', title: '🎯 اتوقع الان' }
      ],
      ...options
    });
  }
});

// Push notification event (from FCM or WebPush Server)
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const payload = event.data.json();
    const notificationTitle = payload.notification?.title || payload.data?.title || 'كورة - إشعار مباراة ⚽';
    const notificationOptions = {
      body: payload.notification?.body || payload.data?.body || 'تحديث جديد للمباراة! اضغط للتوقع',
      icon: payload.data?.icon || '/pwa-192x192.png',
      badge: '/favicon-32x32.png',
      vibrate: [250, 100, 250, 100, 250],
      tag: payload.data?.tag || `kora-${Date.now()}`,
      renotify: true,
      requireInteraction: true,
      data: payload.data || {},
      actions: [
        { action: 'predict', title: payload.data?.ctaText || '🎯 اتوقع الان' }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(notificationTitle, notificationOptions)
    );
  } catch (err) {
    console.error('Push event error in SW:', err);
  }
});

// Notification Click handler on Mobile (Opens app & triggers prediction modal)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const matchId = event.notification.data?.matchId || '';
  const targetUrl = matchId ? `/?predict=${matchId}#matches` : '/#matches';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if ('focus' in client) {
          client.postMessage({
            type: 'KORA_OPEN_PREDICT',
            matchId: matchId
          });
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
