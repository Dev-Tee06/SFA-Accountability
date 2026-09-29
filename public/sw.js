self.addEventListener('push', function (event) {
  if (event.data) {
    try {
      const data = event.data.json();
      const options = {
        body: data.body,
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        vibrate: [100, 50, 100],
        sound: data.sound, // Attempt to play custom sound if supported by platform
        data: {
          url: data.url || '/',
        },
      };

      event.waitUntil(self.registration.showNotification(data.title, options));
    } catch (e) {
      // Fallback if not JSON
      const options = {
        body: event.data.text(),
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
      };
      event.waitUntil(self.registration.showNotification('SFA Accountability', options));
    }
  }
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      // If a window tab for SFA is already open, focus it and navigate
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(self.registration.scope) && 'focus' in client) {
          client.navigate(urlToOpen);
          return client.focus();
        }
      }
      // Otherwise, open a new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
