import type { NextConfig } from "next";
import bundleAnalyzer from '@next/bundle-analyzer';
// @ts-expect-error next-pwa has no type declarations
import withPWAInit from "next-pwa";
// @ts-expect-error next-pwa has no type declarations
import defaultCache from "next-pwa/cache";

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  // 오프라인 시 /offline.html을 precache에서 반환 (public/ 폴더 파일은 자동 precache됨)
  fallbacks: {
    document: "/offline.html",
  },
  runtimeCaching: [
    // navigate 요청은 캐싱하지 않고 항상 네트워크에서 가져온다.
    // 이렇게 해야 Edge 미들웨어(인증 리다이렉트)가 항상 서버에서 실행된다.
    // 오프라인이거나 네트워크 실패 시에는 fallbacks.document(/offline.html)가 반환된다.
    {
      urlPattern: ({ request }: { request: Request }) =>
        request.mode === "navigate",
      handler: "NetworkOnly",
      options: {},
    },
    // _next/static은 CacheFirst: 콘텐츠 해시가 포함된 파일이므로 장기 캐시 안전
    // defaultCache의 static-js-assets/static-style-assets보다 앞에 위치해 우선 적용
    {
      urlPattern: /^\/_next\/static\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "next-static",
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
      },
    },
    // "others"(동일 출처 비-API 경로)는 navigate를 제외하고 적용.
    // defaultCache의 "others"는 navigate 요청도 매칭하여 위 NetworkOnly 규칙과
    // 캐시 버킷이 겹칠 수 있으므로 해당 항목을 제거하고 직접 등록한다.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...defaultCache.filter((e: any) => e.options?.cacheName !== "others"),
    {
      urlPattern: ({ url, request }: { url: URL; request: Request }) => {
        if (self.origin !== url.origin) return false;
        if (url.pathname.startsWith("/api/")) return false;
        if (request.mode === "navigate") return false;
        return true;
      },
      handler: "NetworkFirst" as const,
      options: { cacheName: "others" },
    },
  ],
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        // Google Cloud Storage public URL
        protocol: "https",
        hostname: "storage.googleapis.com",
        pathname: "/**",
      },
      {
        // 로컬 개발 백엔드
        protocol: "http",
        hostname: "localhost",
        port: "8080",
        pathname: "/**",
      },
    ],
  },
};

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

export default withBundleAnalyzer(withPWA(nextConfig));
