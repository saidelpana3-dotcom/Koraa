importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Fetch Firebase Config from local file or environment
fetch('/firebase-applet-config.json')
  .then(response => response.json())
  .then(config => {
    firebase.initializeApp(config);
    const messaging = firebase.messaging();

    messaging.onBackgroundMessage((payload) => {
      console.log('[firebase-messaging-sw.js] Received background message ', payload);
      const notificationTitle = payload.notification?.title || 'Kora Goal Alert! ⚽';
      const notificationOptions = {
        body: payload.notification?.body || 'تحديث جديد في المباراة',
        icon: '/manifest.json'
      };

      self.registration.showNotification(notificationTitle, notificationOptions);
    });
  })
  .catch(err => {
    console.warn('Could not initialize Firebase in service worker:', err);
  });
