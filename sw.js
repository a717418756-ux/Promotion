// Promotion PWA：只管理本專案 tb 版本快取，避免清除同源其他 PWA 的快取。
const V = 'tb-2026-10-25c';
const CACHE = 'promotion-' + V;
const CACHE_PREFIX = 'promotion-tb-';
const CORE = [
  './', 'index.html', 'manifest.webmanifest',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png',
  'data/criminal.json', 'data/procedure.json', 'data/duty.json',
  'data/essay-memory.json', 'data/laws.json',
  'story/vn.css', 'story/vn.js', 'story/episodes.json',
  'assets/vn/station.webp', 'assets/vn/park.webp', 'assets/vn/evidence.webp',
  'assets/vn/home.webp', 'assets/vn/office.webp',
  'assets/vn/player.webp', 'assets/vn/senior.webp', 'assets/vn/reporter.webp',
  'assets/vn/suspect.webp', 'assets/vn/mother.webp'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(CORE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(names => Promise.all(names
        .filter(name => name.startsWith(CACHE_PREFIX) && name !== CACHE)
        .map(name => caches.delete(name))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  const scope = new URL(self.registration.scope);
  if (url.origin !== scope.origin || !url.pathname.startsWith(scope.pathname)) return;

  // 首頁上線時優先讀網路新版本；離線則顯示完整快取首頁。
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      try {
        const response = await fetch(request);
        if (response.ok) await cache.put(request, response.clone());
        return response;
      } catch (error) {
        return (await cache.match(request, {ignoreSearch: true}))
          || (await cache.match('index.html'))
          || Response.error();
      }
    })());
    return;
  }

  // 其他靜態資源離線優先；連網時在背景刷新快取。
  event.respondWith(caches.open(CACHE).then(async cache => {
    const hit = await cache.match(request);
    const refresh = fetch(request).then(async response => {
      if (response.ok) await cache.put(request, response.clone());
      return response;
    });
    if (hit) {
      event.waitUntil(refresh.catch(() => {}));
      return hit;
    }
    return refresh;
  }));
});
