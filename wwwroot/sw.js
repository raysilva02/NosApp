const CACHE_NAME = "nos-cache-v2";
const urlsToCache = [
    "/css/site.css",
    "/manifest.json",
    "/icons/icon-192.png",
    "/icons/icon-512.png"
];

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
    );
    self.skipWaiting();
});

self.addEventListener("fetch", event => {
    if (event.request.method !== "GET") return;
    if (event.request.mode === "navigate") return;
    if (event.request.url.startsWith("chrome-extension")) return;
    if (!event.request.url.startsWith(self.location.origin)) return;

    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
            .catch(() => { })
    );
});

self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});
