const CACHE = 'sidur-evoda-v3';
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
