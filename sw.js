// Service worker simples: permite instalar o app e abrir a tela offline.
// Caminhos relativos para funcionar no subdiretório do GitHub Pages.
const CACHE = "radar-v3"
const SHELL = ["./", "./manifest.webmanifest", "./icons/icon-192.png"]
const scope = new URL("./", self.location).pathname

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
  if (req.method !== "GET" || url.origin !== self.location.origin) return

  // rede primeiro; sem internet, usa o que estiver guardado
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put(req, copy))
        }
        return res
      })
      .catch(() => caches.match(req).then((r) => r || caches.match(scope))),
  )
})
