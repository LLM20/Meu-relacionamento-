// Service worker: faz o site funcionar offline e abrir rápido como app.
// Sempre que trocar fotos ou arquivos, aumente o número da VERSAO.
const VERSAO = 'v2';
const CACHE_APP = `nosso-amor-app-${VERSAO}`;
const CACHE_EXTRA = `nosso-amor-extra-${VERSAO}`;

const ARQUIVOS = [
  './', 'index.html', 'futuro.html', 'teste1.html',
  'index.css', 'futuro.css', 'teste2.css', 'app.css',
  'index.js', 'carrosel.js', 'editor-fotos.js', 'teste3.js', 'app.js',
  'manifest.webmanifest',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png',
  'img/1.jpg', 'img/2.jpg', 'img/3.jpg', 'img/4.jpg', 'img/5.jpg', 'img/6.jpg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_APP).then((cache) =>
      // um arquivo ausente não pode derrubar a instalação inteira
      Promise.all(ARQUIVOS.map((url) => cache.add(url).catch(() => {})))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((chaves) => Promise.all(
        chaves.filter((c) => c !== CACHE_APP && c !== CACHE_EXTRA).map((c) => caches.delete(c))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  if (req.headers.has('range')) return;            // vídeo/áudio: deixa o navegador cuidar

  const url = new URL(req.url);

  // Fontes do Google: cache + atualização em segundo plano
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(staleWhileRevalidate(req, CACHE_EXTRA));
    return;
  }

  if (url.origin !== self.location.origin) return; // Spotify etc.: não interceptar
  if (url.pathname.endsWith('.mp4')) return;       // vídeo grande: sempre da rede

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((resp) => { copiar(req, resp, CACHE_APP); return resp; })
        .catch(() => caches.match(req, { ignoreSearch: true }).then((r) => r || caches.match('index.html')))
    );
    return;
  }

  if (req.destination === 'image') {
    event.respondWith(
      caches.match(req).then((r) => r || fetch(req).then((resp) => { copiar(req, resp, CACHE_APP); return resp; }))
    );
    return;
  }

  // CSS / JS: tenta a rede primeiro (pega atualizações), cai para o cache offline
  event.respondWith(
    fetch(req)
      .then((resp) => { copiar(req, resp, CACHE_APP); return resp; })
      .catch(() => caches.match(req, { ignoreSearch: true }))
  );
});

function copiar(req, resp, nome) {
  if (resp && resp.ok && resp.type === 'basic') {
    const copia = resp.clone();
    caches.open(nome).then((c) => c.put(req, copia));
  }
}

function staleWhileRevalidate(req, nome) {
  return caches.open(nome).then((cache) =>
    cache.match(req).then((cacheado) => {
      const rede = fetch(req).then((resp) => { cache.put(req, resp.clone()); return resp; }).catch(() => cacheado);
      return cacheado || rede;
    })
  );
}
