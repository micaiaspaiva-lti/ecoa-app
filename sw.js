/* Service worker: mantém a casca do Ecoa disponível offline (para poder instalar como app).
   O conteúdo do sistema (Apps Script) é sempre buscado na rede. */
const CACHE = 'ecoa-casca-v2';
const SHELL = ['./', './index.html', './apresentar/', './apresentar/index.html', './casca.css', './casca.js', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png', './icons/simbolo.svg'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  // rede primeiro (pega atualizações na hora); sem conexão, usa a cópia guardada
  e.respondWith(
    fetch(req)
      .then((res) => { if (res.ok) { const copia = res.clone(); caches.open(CACHE).then((c) => c.put(req, copia)); } return res; })
      .catch(() => caches.match(req, { ignoreSearch: true }))
  );
});
