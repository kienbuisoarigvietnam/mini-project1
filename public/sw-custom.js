self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'vku-survey-sync' || event.tag.startsWith('vku-survey-sync-')) {
    event.waitUntil(
      clients
        .matchAll({ includeUncontrolled: true, type: 'window' })
        .then((clientsList) => {
          clientsList.forEach((client) => {
            client.postMessage({ type: 'BACKGROUND_SYNC', tag: event.tag });
          });
        })
        .catch((err) => console.error('[SW] Background sync error:', err))
    );
  }
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(req)
        .then((resp) => {
          const copy = resp.clone();
          caches.open('vku-api-cache').then((cache) => cache.put(req, copy));
          return resp;
        })
        .catch(() =>
          caches.match(req).then((cached) => cached || Response.error())
        )
    );
    return;
  }
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k.startsWith('vku-') && !k.startsWith('vku-static-assets') && !k.startsWith('vku-images') && !k.startsWith('vku-api-cache'))
          .map((k) => caches.delete(k))
      )
    )
  );
});
