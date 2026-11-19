/* eslint-disable no-restricted-globals */
// FITVANT — Firebase Cloud Messaging (FCM) & Native Web Push Service Worker

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// 1. Handle incoming W3C Web Push / Firebase Cloud Messaging background push events
self.addEventListener('push', (event) => {
  let payload = {
    title: '🔥 Nhắc Tập FITVANT',
    body: 'Giáo án Calisthenics 15 phút hôm nay đã sẵn sàng. Hãy vào tập để giữ chuỗi Streak!',
    link: '/workout',
  };

  if (event.data) {
    try {
      const json = event.data.json();
      const notif = json.notification || {};
      const data = json.data || {};
      payload = {
        title: notif.title || data.title || payload.title,
        body: notif.body || data.body || payload.body,
        link: data.link || notif.click_action || '/workout',
      };
    } catch {
      payload.body = event.data.text() || payload.body;
    }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      tag: 'fitvant-workout-reminder',
      renotify: true,
      data: { url: payload.link || '/workout' },
    }),
  );
});

// 2. Handle direct message triggers from client or scheduled background reminders
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_WORKOUT_NOTIFICATION') {
    const { title, body, link } = event.data.payload || {};
    self.registration.showNotification(title || '🔥 Nhắc Tập FITVANT', {
      body:
        body ||
        'Giáo án Calisthenics 15 phút hôm nay đã sẵn sàng. Hãy vào tập để giữ chuỗi Streak!',
      tag: 'fitvant-workout-reminder',
      renotify: true,
      data: { url: link || '/workout' },
    });
  }
});

// 3. Open or focus /workout when user clicks the notification banner
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/workout';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ('focus' in client) {
          client.focus();
          if ('navigate' in client) {
            client.navigate(targetUrl);
          }
          return;
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    }),
  );
});
