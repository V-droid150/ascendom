/* global clients */
/**
 * Push handlers, pulled into the Workbox-generated sw.js via importScripts
 * (see scripts/build-sw.mjs). Payloads come from the `send-reminders` Edge
 * Function: { title, body, tag, url }.
 */

self.addEventListener('push', function (event) {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : '' };
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'Ascendom', {
      body: data.body || '',
      tag: data.tag,
      icon: '/logo192.png',
      badge: '/logo192.png',
      data: { url: data.url || '/' },
    }),
  );
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (windows) {
      for (let i = 0; i < windows.length; i += 1) {
        if ('focus' in windows[i]) return windows[i].focus();
      }
      return clients.openWindow(url);
    }),
  );
});
