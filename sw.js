const CACHE_NAME = 'rafeeq4-core-v18';
const APP_SHELL = [
  './',
  './index.html',
  './styles.css?v=16',
  './variables.css',
  './config.js',
  './prayer.js',
  './locations.js',
  './router.js?v=6201a31',
  './app.js',
  './js/location-manager.js',
  './js/page-modules.js',
  './js/native-notifications.js',
  './pages/home.html',
  './pages/home.js?v=two-fixes',
  './pages/quran.html',
  './pages/quran.js',
  './pages/quran-local.json',
  './pages/tafsir.html',
  './pages/tafsir.js',
  './pages/tafsir-saadi-local.json',
  './pages/azkar.html',
  './pages/azkar.js',
  './pages/azkar-data.json',
  './pages/nawawi.html',
  './pages/nawawi.js',
  './pages/nawawi-data.json',
  './pages/prayer.html',
  './pages/prayer.js',
  './pages/qibla.html',
  './pages/qibla.js',
  './pages/settings.html',
  './pages/settings.js',
  './manifest.json',
  './assets/icons/icon.svg',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/apple-touch-icon.png',
  './assets/icons/kaaba.svg',
  './assets/icons/icon-quran.svg',
  './assets/icons/icon-quran.png',
  './assets/icons/icon-nawawi.svg',
  './assets/icons/icon-nawawi.png',
  './assets/icons/icon-azkar.svg',
  './assets/icons/icon-azkar.png',
  './assets/icons/icon-qibla.svg',
  './assets/icons/icon-qibla.png',
  './assets/audio/adhan.mp3'
];

async function cacheShell() {
  const cache = await caches.open(CACHE_NAME);
  await Promise.all(APP_SHELL.map(async path => {
    try {
      const request = new Request(path, { cache: 'no-store' });
      const response = await fetch(request);
      if (response.ok) await cache.put(request, response);
    } catch (_) {
      // مورد اختياري فشل لا يجب أن يمنع تثبيت Service Worker كاملًا.
    }
  }));
}

async function cachedResponse(request) {
  const exact = await caches.match(request);
  if (exact) return exact;
  return caches.match(request, { ignoreSearch: true });
}

self.addEventListener('install', event => {
  event.waitUntil(cacheShell().then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key.startsWith('rafeeq4-') && key !== CACHE_NAME)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith((async () => {
    const cached = await cachedResponse(event.request);
    if (cached) return cached;

    try {
      const response = await fetch(event.request);
      if (response.ok) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy)).catch(() => {});
      }
      return response;
    } catch (_) {
      if (event.request.mode === 'navigate') {
        return (await cachedResponse(new Request('./index.html'))) ||
          (await cachedResponse(new Request('./')));
      }
      return new Response('', { status: 503, statusText: 'Offline resource unavailable' });
    }
  })());
});
