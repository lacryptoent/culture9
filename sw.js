// Service worker de Culture 9 (version installable, culture-pwa/). Modèle : tools/build-culture.mjs remplace 439ff7573a.
// Le jeu s'ouvre instantanément et sans réseau : tout est servi depuis le cache, et la version en ligne est
// récupérée en arrière-plan (elle sert au lancement suivant). Les polices Google sont gardées aussi.
const CACHE = 'culture9-__VERSION__';
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png'];
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) if (key.startsWith('culture9-') && key !== CACHE) await caches.delete(key);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin && !FONT_HOSTS.includes(url.hostname)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(req, { ignoreSearch: url.origin === self.location.origin });
    const fresh = fetch(req).then((res) => {
      if (res.ok || res.type === 'opaque') cache.put(req, res.clone());
      return res;
    }).catch(() => null);
    if (cached) {
      event.waitUntil(fresh);
      return cached;
    }
    return (await fresh) || (req.mode === 'navigate' ? cache.match('index.html') : Response.error());
  })());
});
