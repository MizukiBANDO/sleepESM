const CACHE_NAME = 'sleep-logger-cache-v1';
const urlsToCache = [
  "/component/memo.md",
  "/component/page_contents/loginState.html",
  "/component/page_parts/bottomNav.html",
  "/component/page_parts/head.html",
  "/component/page_parts/leftColumn.html",
  "/component/page_parts/leftOffcanvas.html",
  "/component/page_parts/rightColumn.html",
  "/component/page_parts/rightOffcanvas.html",
  "/component/page_parts/topNav.html",
  "/css/index.css",
  "/index.css",
  "/index.html",
  "/manifest.json",
  "/page/0.common/content.html",
  "/page/1.account/index.html",
  "/page/1.account/script.js",
  "/page/2.function/index.html",
  "/page/2.function/script.js",
  "/page/3.log/index.html",
  "/page/3.log/script.js",
  "/page/4.notification/index.html",
  "/page/4.notification/script.js",
  "/page/index.html",
  "/page/script.js",
  "/page/study/index.html",
  "/page/study/script.js",
  "/script/api.js",
  "/script/column-left.js",
  "/script/column-right.js",
  "/script/index.js",
  "/script/root.js",
  "/script/setting/config.js",
  "/script/setting/content-left.js",
  "/script/setting/content-right.js",
  "/script/setting/state.js",
  "/script/sleepItems.js",
  "/service-worker.js",
  "/sw-cache-list.js"
];

self.addEventListener('install', event => {
  console.log('[SW] Install triggered');
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Caching essential files...');
      return cache.addAll(urlsToCache);  // ← ここを修正
    }).then(() => {
      console.log('[SW] All files cached successfully!');
    }).catch(err => {
      console.error('[SW] Caching failed:', err);
    })
  );
});

// アクティベート時：古いキャッシュを削除
self.addEventListener('activate', event => {
  clients.claim();
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
});

// フェッチ処理：キャッシュ優先 + fallback
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request);
    }).catch(() => {
      // オフライン時のフォールバック（必要に応じて変更）
      return new Response('⚠️ オフラインで読み込めませんでした', {
        status: 503,
        statusText: 'Offline'
      });
    })
  );
});
