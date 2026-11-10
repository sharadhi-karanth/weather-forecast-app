
const CACHE_NAME = "weatherly-v1";

const APP_FILES = [
    "./",
    "./index.html",
    "./style.css",
    "./script.js",
    "./manifest.json",
    "./icons/weatherly-192.png",
    "./icons/weatherly-512.png"
];

// Install the service worker and cache app files
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(APP_FILES);
        })
    );

    self.skipWaiting();
});

// Activate the service worker
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        })
    );

    self.clients.claim();
});

// Handle requests
self.addEventListener("fetch", (event) => {
    const request = event.request;

    // Only handle GET requests from this website
    if (
        request.method !== "GET" ||
        new URL(request.url).origin !== self.location.origin
    ) {
        return;
    }

    // For page navigation, try the network first
    if (request.mode === "navigate") {
        event.respondWith(
            fetch(request).catch(async () => {
                return await caches.match("./index.html");
            })
        );
        return;
    }

    // For other app files, use the cache first
    event.respondWith(
        caches.match(request).then((cachedResponse) => {
            return cachedResponse || fetch(request).then((response) => {
                if (response.ok) {
                    const responseCopy = response.clone();

                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, responseCopy);
                    });
                }

                return response;
            });
        })
    );
});
