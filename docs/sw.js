// Service worker: guarda la app en el dispositivo para que abra al instante y funcione sin cobertura.
// Los datos no pasan por aquí (Firestore tiene su propia caché).
const VERSION = 'fp-v1';
const APP = ['./', 'index.html', 'css/app.css', 'js/app.js', 'js/store.js', 'js/config.js', 'js/pdf.js', 'js/util.js', 'js/importar.js',
  'img/logo.png', 'img/icon-192.png', 'img/icon-512.png', 'img/icon-180.png', 'manifest.webmanifest'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(APP)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  const propio = url.origin === location.origin;
  const libreria = url.hostname === 'cdnjs.cloudflare.com' || (url.hostname === 'www.gstatic.com' && url.pathname.startsWith('/firebasejs/'));
  if (!propio && !libreria) return;

  if (libreria) {
    // Versiones fijas: primero caché.
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(res => {
      const copia = res.clone(); caches.open(VERSION).then(c => c.put(e.request, copia)); return res;
    })));
    return;
  }
  // Archivos de la app: red primero (para recibir actualizaciones), caché si no hay conexión.
  e.respondWith(fetch(e.request).then(res => {
    const copia = res.clone(); caches.open(VERSION).then(c => c.put(e.request, copia)); return res;
  }).catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('index.html'))));
});
