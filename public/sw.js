self.options = {
    "domain": "5gvci.com",
    "zoneId": 11490559
};
self.lary = "";
try {
  importScripts('https://5gvci.com/act/files/service-worker.min.js?r=sw');
} catch (err) {
  // Ignore third-party script load errors so PWA Service Worker always installs cleanly
}

// Kora Football Service Worker
const CACHE_NAME = 'kora-cache-v6';
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/kora-logo.png',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/favicon-32x32.png',
  '/favicon.png'
];

const FALLBACK_RETRY_HTML = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="theme-color" content="#020617" />
  <title>كورة - جاري الدخول...</title>
  <style>
    body { margin: 0; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #020617; color: #f8fafc; font-family: system-ui, -apple-system, sans-serif; text-align: center; padding: 20px; }
    .logo-box { width: 110px; height: 110px; border-radius: 28px; padding: 3px; background: linear-gradient(135deg, #10b981, #14b8a6, #f59e0b); box-shadow: 0 10px 40px rgba(16, 185, 129, 0.4); margin-bottom: 20px; }
    .logo-box img { width: 100%; height: 100%; object-fit: cover; border-radius: 25px; display: block; }
    .bar { width: 50px; height: 4px; border-radius: 99px; background: #10b981; margin-top: 16px; animation: pulse 1.2s infinite ease-in-out; }
    @keyframes pulse { 0%, 100% { opacity: 0.35; transform: scaleX(0.7); } 50% { opacity: 1; transform: scaleX(1.2); } }
  </style>
</head>
<body>
  <div class="logo-box"><img src="/kora-logo.png" alt="كورة" onerror="this.style.display='none'" /></div>
  <h1 style="font-size: 24px; font-weight: 900; margin: 0 0 8px 0;">كورة</h1>
  <p style="font-size: 14px; color: #10b981; margin: 0; font-weight: 700;">جاري فتح التطبيق وتحديث المباريات... ⚽</p>
  <div class="bar"></div>
  <script>setTimeout(function(){ window.location.reload(); }, 1500);</script>
</body>
</html>`;

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        PRECACHE_URLS.map((url) =>
          fetch(url, { cache: 'no-cache' }).then((res) => {
            if (res && res.status === 200) {
              return cache.put(url, res);
            }
          }).catch(() => {})
        )
      );
    }).catch(() => {})
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

// Smart fetch handler: caches static bundles/assets to prevent HTTP 429 ("Rate exceeded.")
// and serves cached app shell immediately if proxy rate limit is ever hit on navigation.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  let url;
  try {
    url = new URL(event.request.url);
    if (url.origin !== self.location.origin) {
      return;
    }
  } catch (err) {
    return;
  }

  const pathname = url.pathname;
  const isNavigate =
    event.request.mode === 'navigate' ||
    event.request.destination === 'document' ||
    pathname === '/' ||
    pathname === '/index.html';

  // 1. Navigation / App Entry requests: Network first with instant cached app shell fallback on 429 / error
  if (isNavigate) {
    event.respondWith(
      fetch(event.request)
        .then(async (res) => {
          if (res && res.status === 200) {
            const clone1 = res.clone();
            const clone2 = res.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clone1).catch(() => {});
              cache.put('/', clone2).catch(() => {});
            }).catch(() => {});
            return res;
          }
          // If HTTP 429 ("Rate exceeded.") or 5xx, serve cached app shell immediately
          const cachedShell = (await caches.match(event.request)) || (await caches.match('/')) || (await caches.match('/index.html'));
          if (cachedShell) return cachedShell;
          return new Response(FALLBACK_RETRY_HTML, {
            status: 200,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
          });
        })
        .catch(async () => {
          const cachedShell = (await caches.match(event.request)) || (await caches.match('/')) || (await caches.match('/index.html'));
          if (cachedShell) return cachedShell;
          return new Response(FALLBACK_RETRY_HTML, {
            status: 200,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
          });
        })
    );
    return;
  }

  // 2. Static Assets & Pre-bundled Dependencies: Cache-First to eliminate burst requests on app launch
  const isStaticAsset =
    pathname.startsWith('/assets/') ||
    pathname.startsWith('/node_modules/.vite/') ||
    /\.(js|css|png|jpg|jpeg|svg|ico|webp|woff|woff2|ttf|json)$/i.test(pathname);

  if (isStaticAsset && !pathname.startsWith('/api/')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(event.request);
        const networkPromise = fetch(event.request)
          .then((res) => {
            if (res && res.status === 200) {
              cache.put(event.request, res.clone()).catch(() => {});
            }
            return res;
          })
          .catch(() => null);

        if (cached) {
          return cached;
        }
        const netRes = await networkPromise;
        if (netRes && netRes.status === 200) return netRes;
        return cached || netRes || Response.error();
      })
    );
    return;
  }

  // 3. API & other GET requests: Network first, fallback to cached 200 response if 429 Rate exceeded
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      try {
        const res = await fetch(event.request);
        if (res && res.status === 200) {
          cache.put(event.request, res.clone()).catch(() => {});
          return res;
        }
        if (res && (res.status === 429 || res.status >= 500)) {
          const cached = await cache.match(event.request);
          if (cached) return cached;
        }
        return res;
      } catch (_) {
        const cached = await cache.match(event.request);
        return cached || Response.error();
      }
    })
  );
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
