const CACHE_NAME = "hangeul-play-v2";
const APP_SHELL = [
  "/",
  "/manifest.json",
  "/icons/icon.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

// 페이지 이동(navigation)은 네트워크 우선, 실패하면 캐시된 앱 화면을 보여준다.
// 그 외 정적 자원은 캐시 우선으로 응답해 오프라인에서도 빠르게 뜨도록 한다.
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match("/").then((res) => res || caches.match(request)))
    );
    return;
  }

  // 오디오는 브라우저가 구간 요청(Range)으로 가져와 206 응답이 오는데,
  // 206 응답은 캐시에 넣을 수 없으므로 캐시를 건드리지 않고 그대로 흘려보낸다.
  if (request.headers.has("range")) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          // status 200 인 완전한 응답만 캐시할 수 있다 (206 등 부분 응답은 제외)
          if (response.status === 200 && request.url.startsWith(self.location.origin)) {
            const clone = response.clone();
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(request, clone))
              .catch(() => {
                // 캐시에 못 넣어도 재생 자체에는 문제가 없으므로 무시한다
              });
          }
          return response;
        })
        .catch(() => cached);
    })
  );
});
