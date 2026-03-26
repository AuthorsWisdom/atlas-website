const CACHE_NAME = 'xatlas-v3'
const STATIC_ASSETS = [
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/logo.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Never cache Railway calls — always go to network
  if (url.hostname.includes('railway.app')) {
    event.respondWith(fetch(event.request))
    return
  }

  // Never cache Binance calls
  if (url.hostname.includes('binance.com')) {
    event.respondWith(fetch(event.request))
    return
  }

  // Never cache API routes — always network
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(event.request).catch(() => caches.match(event.request)))
    return
  }

  // Never cache POST/PUT/DELETE
  if (event.request.method !== 'GET') {
    event.respondWith(fetch(event.request))
    return
  }

  // Navigation: network-first
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
          return response
        })
        .catch(() => caches.match(event.request) || caches.match('/app'))
    )
    return
  }

  // Static assets: stale-while-revalidate
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetched = fetch(event.request).then((response) => {
        const clone = response.clone()
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
        return response
      })
      return cached || fetched
    })
  )
})
