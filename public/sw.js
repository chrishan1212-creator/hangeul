const CACHE_NAME = "hangeul-play-v3";

/** 오프라인에서도 앱이 뜨도록 미리 담아두는 것들 */
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

/**
 * 내용이 바뀌지 않는 파일만 캐시를 먼저 본다.
 *
 * /_next/static 아래 파일들은 이름에 고유한 값이 붙어 있어서 내용이 바뀌면
 * 이름도 바뀐다. 그래서 캐시를 먼저 봐도 오래된 내용이 나올 일이 없다.
 *
 * 반대로 화면 데이터(HTML, 페이지 이동에 쓰는 데이터)는 캐시를 먼저 보면
 * 배포 후에 예전 내용이 나와서, 브라우저가 이를 복구하려고 페이지를 통째로
 * 새로 여는 일이 생긴다. (그러면 배경음악도 끊긴다) 그래서 항상 네트워크 우선.
 */
function isImmutableAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/music/") ||
    url.pathname.startsWith("/audio/")
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // 오디오는 브라우저가 구간 요청(Range)으로 가져와 206 응답이 오는데,
  // 206 응답은 캐시에 넣을 수 없으므로 캐시를 건드리지 않고 그대로 흘려보낸다.
  if (request.headers.has("range")) return;

  // 페이지 이동은 항상 네트워크 우선. 인터넷이 없을 때만 캐시된 화면을 보여준다.
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match("/")));
    return;
  }

  if (isImmutableAsset(url)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.status === 200) {
            const clone = response.clone();
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(request, clone))
              .catch(() => {
                // 캐시에 못 넣어도 사용에는 지장이 없다
              });
          }
          return response;
        });
      })
    );
    return;
  }

  // 그 밖의 것(화면 데이터 등)은 네트워크 우선, 실패하면 캐시로 대체
  event.respondWith(fetch(request).catch(() => caches.match(request)));
});
