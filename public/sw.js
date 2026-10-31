// Service worker simples: permite instalar o app e abrir a tela offline.
// As buscas (/api) sempre vão para a rede.
const CACHE = "radar-v1"
const SHELL = ["/", "/manifest.webmanifest", "/icons/icon-192.png"]

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()))
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener("fetch", (event) => {
  const req = event.request
  const url = new URL(req.url)
  if (req.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/api")) return

  // network-first, cai para o cache quando offline
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok && (req.mode === "navigate" || url.pathname.startsWith("/_next/static") || url.pathname.startsWith("/icons"))) {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put(req, copy))
        }
        return res
      })
      .catch(() => caches.match(req).then((r) => r || caches.match("/"))),
  )
})
