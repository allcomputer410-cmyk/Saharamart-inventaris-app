// ─── Service Worker — Inventaris Multi-Toko ───────────────────────────────────
// Strategi: Cache-first untuk aset statis, Network-first untuk API/data

const CACHE_NAME = 'inventaris-v1';
const STATIC_ASSETS = [
  '/',
  '/pilih-toko',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// ── Install: cache aset statis ─────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // Jangan gagal install kalau ada asset yang tidak bisa di-cache
        console.log('[SW] Some static assets could not be cached');
      });
    })
  );
  self.skipWaiting();
});

// ── Activate: hapus cache lama ────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch: strategi berdasarkan tipe request ───────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET dan Supabase API (selalu network)
  if (request.method !== 'GET') return;
  if (url.hostname.includes('supabase.co')) return;

  // Untuk navigasi (HTML): Network-first, fallback ke cache
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache halaman yang berhasil dimuat
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match('/'))
        )
    );
    return;
  }

  // Untuk aset statis (_next/static, icons, dll): Cache-first
  if (
    url.pathname.startsWith('/_next/static') ||
    url.pathname.startsWith('/icons') ||
    url.pathname === '/manifest.json'
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            return response;
          })
      )
    );
    return;
  }

  // Default: Network-first
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

// ── Push Notification (untuk notifikasi low stock dari server) ─────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return;
  try {
    const data = event.data.json();
    event.waitUntil(
      self.registration.showNotification(data.title || 'Inventaris', {
        body: data.message || '',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-192x192.png',
        tag: data.tag || 'inventaris-notif',
        data: { url: data.action_url || '/pilih-toko' },
      })
    );
  } catch {
    console.log('[SW] Push data parse error');
  }
});

// ── Notification Click ────────────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/pilih-toko';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});
