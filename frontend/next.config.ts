import type { NextConfig } from "next";
// @ts-expect-error next-pwa has no type declarations
import withPWAInit from "next-pwa";
// @ts-expect-error next-pwa has no type declarations
import defaultCache from "next-pwa/cache";

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  runtimeCaching: [
    // navigate 요청은 NetworkFirst 3초 타임아웃:
    // 미들웨어 인증 리다이렉트가 항상 서버에서 처리되도록 캐시 우선 서빙을 방지
    {
      urlPattern: ({ request }: { request: Request }) =>
        request.mode === "navigate",
      handler: "NetworkFirst",
      options: {
        cacheName: "pages",
        networkTimeoutSeconds: 3,
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
      },
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
    // 이미지·폰트·오디오(BGM)·API 등 나머지는 next-pwa 기본값 유지
    ...defaultCache,
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

export default withPWA(nextConfig);
