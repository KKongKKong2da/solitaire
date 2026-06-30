/* 서비스 워커 — 오프라인 실행 + 빠른 로딩
   전략: 네트워크 우선(온라인이면 항상 최신), 실패 시 캐시 폴백(오프라인 대응).
   index.html 한 파일이 게임 전체이므로 캐싱 대상이 단순하다. */
const CACHE = "solitaire-v2";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
      .catch(() => {})
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  e.respondWith(
    fetch(req)
      .then((res) => {
        // 온라인이면 최신을 받고, 사본을 캐시에 갱신
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() =>
        // 오프라인: 캐시에서 제공, 없으면 메인 페이지로 폴백
        caches.match(req).then((hit) => hit || caches.match("./index.html"))
      )
  );
});
