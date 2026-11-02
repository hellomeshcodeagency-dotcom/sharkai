// Shark AI — service worker. Makes the app open and run with no internet.
// Developed by MeshCode.
// Bump VERSION whenever you change any app file so phones/computers pick up the update.
const VERSION = "shark-ai-v1.1.2";
const SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./llm-worker.js",
  "./ai-worker.js",
  "./manifest.webmanifest",
  "./LICENSES.md",
  "./icons/icon.svg",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/maskable-512.png",
  "./icons/apple-touch-icon.png",
  "./vendor/web-llm.js",
  "./vendor/transformers.min.js",
  "./vendor/pdf.min.mjs",
  "./vendor/pdf.worker.min.mjs",
];

// Third-party hosts whose files we keep for offline use.
// (Model weights are cached separately by the AI libraries themselves.)
const RUNTIME_HOSTS = ["cdn.jsdelivr.net"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith("shark-ai-") && k !== VERSION).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // App files: serve from cache instantly, refresh in the background when online.
  if (url.origin === self.location.origin) {
    if (req.mode === "navigate") {
      event.respondWith((async () => {
        const cache = await caches.open(VERSION);
        try {
          const fresh = await fetch(req);
          if (fresh.ok) cache.put("./index.html", fresh.clone());
          return fresh;
        } catch {
          return (await cache.match("./index.html")) || (await cache.match("./")) || Response.error();
        }
      })());
      return;
    }
    event.respondWith((async () => {
      const cache = await caches.open(VERSION);
      const cached = await cache.match(req, { ignoreSearch: true });
      const network = fetch(req).then((res) => {
        if (res.ok) cache.put(req, res.clone());
        return res;
      }).catch(() => null);
      if (cached) { event.waitUntil(network); return cached; }
      return (await network) || Response.error();
    })());
    return;
  }

  // Runtime engine files from the CDN: cache-first.
  if (RUNTIME_HOSTS.includes(url.hostname)) {
    event.respondWith((async () => {
      const cache = await caches.open(VERSION + "-runtime");
      const cached = await cache.match(req);
      if (cached) return cached;
      const res = await fetch(req);
      if (res.ok) cache.put(req, res.clone());
      return res;
    })());
  }
});
