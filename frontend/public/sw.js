// GramSaathi AI — Service Worker v2
// Strategy: Cache-first for assets, Stale-While-Revalidate for read APIs, Network-only for mutations

const CACHE_NAME    = 'gramsaathi-v2'
const API_CACHE     = 'gramsaathi-api-v2'
const OFFLINE_URL   = '/offline.html'

// Shell assets — cached on install, served instantly forever
const SHELL_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
]

// API routes that are safe to cache (GET read-only data)
const CACHEABLE_API = [
  '/api/user/dashboard',
  '/api/chat/sessions',
  '/api/schemes',
]

// ─── Install ──────────────────────────────────────────────────────────────────
self.addEventListener('install', event => {
  console.log('[SW] v2 Installing...')
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting())
  )
})

// ─── Activate — delete old caches ─────────────────────────────────────────────
self.addEventListener('activate', event => {
  console.log('[SW] v2 Activating...')
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(k => k !== CACHE_NAME && k !== API_CACHE)
          .map(k => { console.log('[SW] Deleting old cache:', k); return caches.delete(k) })
      ))
      .then(() => self.clients.claim())
  )
})

// ─── Fetch ────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  // Skip: non-GET, chrome-extension, POST/mutations, external URLs
  if (request.method !== 'GET') return
  if (url.protocol === 'chrome-extension:') return
  if (!url.origin.includes(self.location.origin) && !url.hostname.includes('localhost')) return

  // ── 1. API calls ─────────────────────────────────────────────────────────
  if (url.pathname.startsWith('/api/')) {
    const isCacheable = CACHEABLE_API.some(p => url.pathname.startsWith(p))

    if (isCacheable) {
      // Stale-While-Revalidate: serve cached instantly, refresh in background
      event.respondWith(staleWhileRevalidate(request))
    } else {
      // Network-first with offline JSON fallback
      event.respondWith(
        fetch(request)
          .catch(() => new Response(
            JSON.stringify({ error: 'You are offline. Please check your internet connection.', offline: true }),
            { status: 503, headers: { 'Content-Type': 'application/json' } }
          ))
      )
    }
    return
  }

  // ── 2. Image uploads (user crop photos) ──────────────────────────────────
  if (url.pathname.startsWith('/uploads/')) {
    event.respondWith(cacheFirst(request, CACHE_NAME))
    return
  }

  // ── 3. Static JS/CSS/font assets (Vite hashed filenames — cache forever) ─
  if (
    url.pathname.includes('/assets/') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.svg')
  ) {
    event.respondWith(cacheFirst(request, CACHE_NAME))
    return
  }

  // ── 4. Navigation (HTML pages) — network-first, offline fallback ──────────
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(res => {
          // Cache the shell
          const clone = res.clone()
          caches.open(CACHE_NAME).then(c => c.put(request, clone))
          return res
        })
        .catch(async () => {
          const cached = await caches.match(request)
          if (cached) return cached
          const shell = await caches.match('/')
          if (shell) return shell
          return caches.match(OFFLINE_URL)
        })
    )
    return
  }
})

// ─── Strategies ───────────────────────────────────────────────────────────────

/**
 * Cache-First: serve from cache, only fetch if not cached
 * Used for: hashed assets, uploaded images
 */
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request)
  if (cached) return cached
  try {
    const res = await fetch(request)
    if (res.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, res.clone())
    }
    return res
  } catch {
    return new Response('Asset unavailable offline', { status: 503 })
  }
}

/**
 * Stale-While-Revalidate: serve cached instantly, update cache in background
 * Used for: dashboard, chat sessions, schemes (read data the user already saw)
 */
async function staleWhileRevalidate(request) {
  const cache   = await caches.open(API_CACHE)
  const cached  = await cache.match(request)

  // Start network fetch in background (don't await yet)
  const fetchPromise = fetch(request).then(res => {
    if (res.ok) cache.put(request, res.clone())
    return res
  }).catch(() => null)

  // Return cached data immediately if available
  if (cached) {
    // Tag the response so the UI knows it's stale
    return cached
  }

  // No cache — wait for network
  const fresh = await fetchPromise
  if (fresh) return fresh

  // Complete offline
  return new Response(
    JSON.stringify({ error: 'Offline — no cached data available', offline: true }),
    { status: 503, headers: { 'Content-Type': 'application/json' } }
  )
}

// ─── Message handler — allow forcing cache clear ──────────────────────────────
self.addEventListener('message', event => {
  if (event.data?.type === 'CLEAR_CACHE') {
    caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))))
    console.log('[SW] Cache cleared by app')
  }
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
