/*
💡 開發者小撇步 (Pro-Tips)
更新快取：如果你未來大幅修改了行程內容，建議把 sw.js 第一行的 CACHE_NAME 改成 v2。這樣使用者重新整理網頁時，瀏覽器才會知道有新內容要下載，而不是一直顯示舊的快取內容。

HTTPS 限制：Service Worker 規定必須在 HTTPS 環境下才能運作。不過別擔心，GitHub Pages 預設就是 HTTPS，所以部署後會直接生效！

測試離線模式：部署後，你可以打開手機的「飛航模式」，再開啟網頁試試看。如果成功的話，你會發現頁面竟然還能正常顯示！
*/

const CACHE_NAME = 'kr-travel-v1.2';
// 列出所有你想在離線時也能看到的檔案
const ASSETS_TO_CACHE = [
    './',
    './manifest.json',
    './icon.png',
    './sw.js'
];

// 安裝 Service Worker 並儲存快取
self.addEventListener('install', (event) => {
    self.skipWaiting();

    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('正在快取旅行資料...');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// 激活階段：清理舊快取
self.addEventListener('activate', (event) => {
    event.waitUntil(
        Promise.all([
            // 取得所有快取名稱
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cache) => {
                        if (cache !== CACHE_NAME) {
                            console.log('清理過時快取:', cache);
                            return caches.delete(cache);
                        }
                    })
                );
            }),
            // 讓新的 SW 立即控制所有開啟的客戶端（頁面）
            self.clients.claim()
        ])
    );
});

// 當沒有網路時，優先從快取抓取內容
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});

// 攔截請求
self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // 如果請求成功，將新內容存入快取（以便下次沒網路時使用）
                const responseClone = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseClone);
                });
                return response;
            })
            .catch(() => {
                // 2. 如果網路失敗（沒訊號），則從快取找資料
                return caches.match(event.request);
            })
    );
});