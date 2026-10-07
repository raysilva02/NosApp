const CACHE_NAME = "nos-cache-v3";
const urlsToCache = [
    "/",
    "/index.html",
    "/app.js",
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
    if (event.request.url.startsWith("chrome-extension")) return;
    if (!event.request.url.startsWith(self.location.origin)) return;

    // Navegação (app shell): tenta a rede e cai para o index.html em cache (offline).
    if (event.request.mode === "navigate") {
        event.respondWith(
            fetch(event.request)
                .then(res => {
                    const copy = res.clone();
                    caches.open(CACHE_NAME).then(c => c.put("/index.html", copy));
                    return res;
                })
                .catch(() => caches.match(event.request).then(r => r || caches.match("/index.html")))
        );
        return;
    }

    // Assets: cache-first, populando o cache quando busca na rede.
    event.respondWith(
        caches.match(event.request)
            .then(cached => {
                if (cached) return cached;
                return fetch(event.request).then(res => {
                    const copy = res.clone();
                    caches.open(CACHE_NAME).then(c => c.put(event.request, copy));
                    return res;
                });
            })
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

self.addEventListener("push", event => {
    const data = event.data?.json() ?? {};
    event.waitUntil(
        self.registration.showNotification(data.title || "Nós", {
            body: data.body || "Nova mensagem recebida",
            icon: "/icons/icon-192.png",
            badge: "/icons/icon-192.png",
            vibrate: [200, 100, 200],
            tag: "nos-mensagem",
            renotify: true,
            requireInteraction: true,
            data: { url: data.url || "/" }
        })
    );
});

self.addEventListener("notificationclick", event => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: "window", includeUncontrolled: true })
            .then(clientList => {
                for (const client of clientList) {
                    if (client.url.includes(self.location.origin) && "focus" in client) {
                        return client.focus();
                    }
                }
                return clients.openWindow(event.notification.data.url);
            })
    );
});
