const CACHE_NAME = 'ykskocum-v98-oturum-kilidi';
const urlsToCache = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './curriculum.js',
  './questions.js',
  './quotes.js',
  './favicon.svg',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        // cache.addAll() tek bir dosya bile 404 verirse TÜM kurulumu iptal
        // eder ve uygulama çevrimdışı desteğini tamamen kaybederdi.
        // Dosyaları tek tek ekleyip eksik olanı atlıyoruz.
        return Promise.all(
          urlsToCache.map(url =>
            cache.add(url).catch(err => console.warn('SW: önbelleğe alınamadı:', url, err))
          )
        );
      })
      .then(() => self.skipWaiting())
  );
});

// Uygulama kodu mu? (HTML/JS/CSS ve sayfa gezinmeleri)
function isAppCode(request) {
  if (request.mode === 'navigate') return true;
  const path = new URL(request.url).pathname;
  return /\.(html|js|css)$/i.test(path);
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  // ------------------------------------------------------------
  // KOD İÇİN "ÖNCE AĞ", VARLIKLAR İÇİN "ÖNCE ÖNBELLEK"
  // ------------------------------------------------------------
  // Eskiden HER istek önce önbellekten karşılanıyordu. Bu yüzden
  // app.js güncellense bile tarayıcı eski sürümü çalıştırmaya devam
  // ediyor, düzeltilen hatalar kullanıcıya hiç ulaşmıyordu (dosya
  // adına ?v= eklense bile eski sekmelerde ve PWA'da sorun sürüyordu).
  // Artık kod her zaman ağdan tazelenir; ağ yoksa önbelleğe düşülür,
  // böylece çevrimdışı desteği korunur.
  if (isAppCode(request)) {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response && response.status === 200 && response.type === 'basic') {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => caches.match(request).then(hit => hit || caches.match('./index.html')))
    );
    return;
  }

  // Görseller, ikonlar, yazı tipleri: önce önbellek (hızlı ve çevrimdışı dostu)
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(response => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        return response;
      });
    })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Notifications
self.addEventListener('push', event => {
  // Fallback if push comes from server
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'YKSKoçum';
  const options = {
    body: data.body || 'Yeni bir bildiriminiz var.',
    icon: './icon-192.png',
    badge: './icon-192.png',
    data: data.data || { url: './' }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const urlToOpen = event.notification.data ? event.notification.data.url : './';
  const action = event.notification.data ? event.notification.data.action : null;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      // Find open window
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          // Send message to the client to handle the internal routing
          client.postMessage({
            type: 'NOTIFICATION_CLICK',
            url: urlToOpen,
            action: action
          });
          return client.focus();
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen).then(client => {
          if (client) {
            // Slight delay to allow app to initialize before routing
            setTimeout(() => {
              client.postMessage({
                type: 'NOTIFICATION_CLICK',
                url: urlToOpen,
                action: action
              });
            }, 1500);
          }
        });
      }
    })
  );
});

self.addEventListener('notificationclose', event => {
  // Analytics could go here
});
