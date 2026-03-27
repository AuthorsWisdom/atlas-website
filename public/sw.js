// XAtlas service worker — bypass all API/data calls
// Only cache static assets (fonts, images, offline shell)

const BYPASS = [
  'fly.dev', 'supabase.co', 'api.anthropic.com', 'api.openai.com',
  'api.x.ai', 'api.mistral.ai', 'generativelanguage.googleapis.com',
  'polygon.io', 'finnhub.io', 'alpaca.markets',
  '/api/', '/score/', '/chart/', '/council/', '/stream', '/ai/',
]

self.addEventListener('fetch', event => {
  if (BYPASS.some(p => event.request.url.includes(p))) return
  // Let browser handle everything else normally
})

// Force immediate activation on update
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()))
