/**
 * 앱인토스(토스 미니앱) 번들은 서버 없이 정적 파일(html/js/css)만 담을 수
 * 있다. 그런데 headers() 는 서버가 있어야만 쓸 수 있는 기능이라 정적
 * 내보내기(output: "export")와는 같이 못 쓴다. 그래서 두 빌드를 나눈다.
 *
 *   npm run build       -> Vercel 배포용 (headers() 있음, 서버 필요)
 *   npm run build:toss  -> 앱인토스(.ait) 배포용 (정적 내보내기)
 */
const isTossBuild = process.env.TOSS_BUILD === "1";

/** @type {import('next').NextConfig} */
const nextConfig = isTossBuild
  ? {
      reactStrictMode: true,
      output: "export",
    }
  : {
      reactStrictMode: true,
      async headers() {
        return [
          {
            source: "/sw.js",
            headers: [
              { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
              { key: "Service-Worker-Allowed", value: "/" },
            ],
          },
          {
            source: "/manifest.json",
            headers: [{ key: "Cache-Control", value: "public, max-age=0, must-revalidate" }],
          },
        ];
      },
    };

export default nextConfig;
