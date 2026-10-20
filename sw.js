// 版本號沿用本專案日期＋字母規則；CacheStorage 對同一來源的其他 PWA 共用，勿刪除其他專案快取。
const V = 'tb-2026-10-20e';
const CACHE = 'promotion-' + V;
const CORE = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png',
  'data/criminal.json', 'data/procedure.json', 'data/duty.json', 'data/essay-memory.json', 'data/laws.json'];
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(names => Promise.all(
  names.filter(name => name.startsWith('promotion-') && name !== CACHE).map(name => caches.delete(name))
)).then(() => self.clients.claim())));
// 同一 PWA 範圍快取優先；背景更新需延長事件生命週期，並避免快取外部來源。
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(new URL(self.registration.scope).pathname)) return;
  e.respondWith(caches.open(CACHE).then(async cache => {
    const hit = await cache.match(e.request);
    const update = fetch(e.request).then(async res => {
      if (res.ok) await cache.put(e.request, res.clone());
      return res;
    });
    if (hit) { e.waitUntil(update.catch(() => {})); return hit; }
    return update;
  }));
});
