const CACHE = 'sidur-evoda-v6';
const ASSETS = ['./', './index.html', './manifest.json', './logo.jpg', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = e.request.url;
  // מנוע ה-OCR (Tesseract) נטען תמיד מהרשת
  if (url.includes('tesseract') || url.includes('cdnjs') || url.includes('cdn.jsdelivr') || url.includes('unpkg')) return;
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
      const copy = res.clone();
      if (e.request.method === 'GET' && res.status === 200 && url.startsWith(self.location.origin)) {
        caches.open(CACHE).then(c => c.put(e.request, copy));
      }
      return res;
    }).catch(() => caches.match('./index.html')))
  );
});

// ===== Push: התראת יום הולדת (נשלחת מ-GitHub Actions, evgenchuk1/sidur-notify) =====
self.addEventListener('push', e => {
  let data = {};
  try { data = e.data ? e.data.json() : {}; } catch (_) { data = { body: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(data.title || '🎂 יום הולדת היום בסניף!', {
    body: data.body || '',
    icon: 'icon-192.png',
    badge: 'icon-192.png',
    tag: data.tag || 'bd',
    renotify: true,
    requireInteraction: true,
    vibrate: [400, 150, 400, 150, 800],
    data: { url: data.url || './?bd=1' }
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = new URL(e.notification.data?.url || './?bd=1', self.registration.scope).href;
  e.waitUntil((async () => {
    const wins = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const w of wins) {
      if (w.url.startsWith(self.registration.scope)) { await w.navigate(url).catch(() => {}); return w.focus(); }
    }
    return clients.openWindow(url);
  })());
});
