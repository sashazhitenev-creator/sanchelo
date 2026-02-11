// Версия кэша
const CACHE_NAME = 'achievements-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/sw.js'
];

// Установка (кэширование файлов при первом запуске)
self.addEventListener('install', event => {
  console.log('📦 Service Worker: Установка...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('💾 Кэширование файлов...');
        return cache.addAll(urlsToCache);
      })
  );
});

// Активация (очистка старых кэшей)
self.addEventListener('activate', event => {
  console.log('✅ Service Worker: Активирован');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Удаление старого кэша:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Перехват запросов (оффлайн-режим)
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Возвращаем кэшированный ответ, если есть
        if (response) {
          console.log('📡 Загрузка из кэша:', event.request.url);
          return response;
        }
        // Иначе — запрашиваем с сервера
        return fetch(event.request)
          .then(response => {
            // Кэшируем новый ответ
            if (response && response.status === 200) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, responseClone);
              });
            }
            return response;
          })
          .catch(() => {
            // Если нет интернета и нет в кэше — показываем сообщение
            if (event.request.url.includes('.html')) {
              return caches.match('/index.html');
            }
          });
      })
  );
});

// Push-уведомления (опционально)
self.addEventListener('push', event => {
  const title = '🏆 Новое достижение!';
  const options = {
    body: event.data ? event.data.text() : 'Вы разблокировали достижение!',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});