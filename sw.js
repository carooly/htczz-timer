const CACHE_NAME = 'htzz-timer-app-v1.0.0';
const API_CACHE_NAME = 'htzz-timer-api-cache';
const urlsToCache = [
    './',
    './index.html',
    './style.css',
    './script.js',
    './manifest.json',
    './sw.js',
    './img/icon-128.png',
    './img/icon-192.png',
    './img/icon-512.png',
    './img/icon-128-online.png',
    './img/icon-128-offline.png',
    './img/icon-128-pwa.png',
    './img/portrait/portrait-bg1.jpg',
    './img/portrait/portrait-bg2.jpg',
    './img/portrait/portrait-bg3.jpg',
    './img/portrait/portrait-bg4.jpg',
    './img/landscape/landscape-bg1.jpg',
    './img/landscape/landscape-bg2.jpg',
    './mp3/music1.opus',
    './mp3/music2.opus'
];

// 安装Service Worker
self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function(cache) {
                console.log('安装新版本缓存:', CACHE_NAME);
                return cache.addAll(urlsToCache);
            })
            .then(() => {
                console.log('所有资源已缓存');
                return self.skipWaiting();
            })
    );
});

// 激活Service Worker
self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.map(function(cacheName) {
                    // 删除所有旧版本的缓存
                    if (cacheName !== CACHE_NAME && cacheName.startsWith('htzz-timer-app')) {
                        console.log('删除旧缓存:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            // 通知所有客户端有新版本可用
            self.clients.matchAll().then(clients => {
                clients.forEach(client => {
                    client.postMessage({
                        type: 'SW_UPDATED',
                        version: CACHE_NAME
                    });
                });
            });
            return self.clients.claim();
        })
    );
});

// 拦截网络请求
self.addEventListener('fetch', function(event) {
    event.respondWith(
        caches.match(event.request)
            .then(function(response) {
                // 如果缓存中有请求的资源，则返回缓存版本
                if (response) {
                    return response;
                }
                
                // 否则从网络获取
                return fetch(event.request).then(function(response) {
                    // 检查是否为有效响应
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }
                    
                    // 克隆响应以进行缓存
                    const responseToCache = response.clone();
                    
                    caches.open(CACHE_NAME)
                        .then(function(cache) {
                            cache.put(event.request, responseToCache);
                        });
                    
                    return response;
                }).catch(function() {
                    // 网络请求失败时，尝试返回缓存的离线页面
                    if (event.request.destination === 'document') {
                        return caches.match('./index.html');
                    }
                });
            })
    );
});