const CACHE_NAME = 'rafeeq4-core-v14';
const APP_SHELL = [
  './', './index.html', './styles.css', './variables.css', './config.js', './prayer.js', './locations.js', './router.js', './app.js',
  './js/location-manager.js', './js/page-modules.js', './pages/home.html', './pages/home.js', './pages/quran.html', './pages/quran.js', './pages/quran-local.json', './pages/tafsir.html', './pages/tafsir.js', './pages/tafsir-saadi-local.json',
  './pages/azkar.html', './pages/azkar.js', './pages/azkar-data.json', './pages/nawawi.html', './pages/nawawi.js', './pages/nawawi-data.json', './pages/prayer.html', './pages/prayer.js', './pages/qibla.html', './pages/qibla.js', './pages/settings.html', './pages/settings.js', './manifest.json', './assets/icons/icon.svg', './assets/icons/icon-192.png', './assets/icons/icon-512.png', './assets/icons/apple-touch-icon.png', './assets/icons/kaaba.svg', './assets/icons/icon-quran.svg', './assets/icons/icon-quran.png', './assets/icons/icon-nawawi.svg', './assets/icons/icon-nawawi.png', './assets/icons/icon-azkar.svg', './assets/icons/icon-azkar.png', './assets/icons/icon-qibla.svg', './assets/icons/icon-qibla.png', './assets/audio/adhan.mp3'
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('rafeeq4-') && key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
    const copy = response.clone();
    caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
    return response;
  }).catch(() => event.request.mode === 'navigate' ? caches.match('./index.html') : Response.error())));
});
