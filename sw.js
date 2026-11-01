/* Avisos do "Nós dois": mostra a notificação e abre o app no recado novo ao tocar. */
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });

self.addEventListener('push', function (e) {
  var d = {};
  try { d = e.data ? e.data.json() : {}; } catch (x) { d = { body: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(d.title || 'Novo recado 💌', {
    body: d.body || 'Você recebeu um recado.',
    icon: 'icon-192.png',
    badge: 'icon-192.png',
    tag: d.tipo === 'vale' ? 'vale' : 'recado',
    renotify: true,
    data: { tipo: d.tipo || 'recado' }
  }));
});

self.addEventListener('notificationclick', function (e) {
  var vale = e.notification.data && e.notification.data.tipo === 'vale';
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
    for (var i = 0; i < list.length; i++) {
      if ('focus' in list[i]) { if (!vale) list[i].postMessage({ type: 'recado-novo' }); return list[i].focus(); }
    }
    return self.clients.openWindow(vale ? './' : './?recado=1');
  }));
});
