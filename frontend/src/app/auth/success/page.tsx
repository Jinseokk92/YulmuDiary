"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/** 축하 화면 총 노출 시간 (ms) — 애니메이션 종료 시점과 맞춤 */
const DISPLAY_MS = 2300;

/**
 * 체크마크 SVG(viewBox 52×52, 원 반지름 24) 기준으로
 * 렌더링 크기 112px(w-28) 외곽 65px 반지름에 배치된 스파클 6개
 */
const SPARKLES = [
  { top: 46,  left: 111, delay: "0.42s" }, // 우
  { top: -10, left: 78,  delay: "0.50s" }, // 우상
  { top: -10, left: 13,  delay: "0.58s" }, // 좌상
  { top: 46,  left: -19, delay: "0.66s" }, // 좌
  { top: 102, left: 13,  delay: "0.74s" }, // 좌하
  { top: 102, left: 78,  delay: "0.82s" }, // 우하
];

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const onboarding = searchParams.get("onboarding");

  /**
   * requestAnimationFrame 이후 CSS 애니메이션 트리거.
   * SSR → hydration 사이 깜빡임 없이 애니메이션 시작.
   */
  const [animStart, setAnimStart] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setAnimStart(true));

    // DISPLAY_MS 후 다음 경로로 이동
    const timer = setTimeout(() => {
      router.replace(onboarding === "true" ? "/onboarding" : "/");
    }, DISPLAY_MS);

    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
    };
  }, [router, onboarding]);

  return (
    <>
      {/* 이 컴포넌트 전용 keyframe — 외부 CSS에 영향 없음 */}
      <style>{`
        @keyframes auth-circle-in {
          0%   { transform: scale(0); opacity: 0; }
          60%  { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1);   opacity: 1; }
        }
        @keyframes auth-draw-check {
          from { stroke-dashoffset: 60; }
          to   { stroke-dashoffset: 0;  }
        }
        @keyframes auth-sparkle-pop {
          0%   { transform: scale(0);   opacity: 0; }
          40%  { transform: scale(1.4); opacity: 1; }
          100% { transform: scale(0);   opacity: 0; }
        }
        @keyframes auth-fade-up {
          from { transform: translateY(10px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes auth-fill-bar {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
      `}</style>

      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-orange-50 to-white select-none">

        {/* ── 체크마크 + 스파클 ── */}
        <div className="relative w-28 h-28 mb-8">

          {/* 스파클 파티클 (6개, 원 바깥에 배치) */}
          {animStart && SPARKLES.map((s, i) => (
            <span
              key={i}
              className="absolute w-2.5 h-2.5 rounded-full bg-primary-400"
              style={{
                top: s.top,
                left: s.left,
                animation: `auth-sparkle-pop 0.85s ease-out ${s.delay} both`,
              }}
            />
          ))}

          {/* SVG: 배경 원 + 체크마크 stroke draw */}
          <svg
            viewBox="0 0 52 52"
            className="w-full h-full text-primary-600"
            aria-hidden="true"
            style={
              animStart
                ? { animation: "auth-circle-in 0.5s ease-out both" }
                : { opacity: 0 }
            }
          >
            <circle
              cx="26" cy="26" r="24"
              fill="currentColor"
              fillOpacity="0.08"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M14 27l8 8 16-16"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="60"
              /* animStart 전: 경로 숨김(dashoffset=60), 후: 애니메이션으로 제어 */
              strokeDashoffset={animStart ? undefined : 60}
              style={
                animStart
                  ? { animation: "auth-draw-check 0.55s ease-out 0.3s both" }
                  : {}
              }
            />
          </svg>
        </div>

        {/* ── 텍스트 ── */}
        <h1
          className="text-2xl font-bold text-gray-800 mb-2"
          style={
            animStart
              ? { animation: "auth-fade-up 0.5s ease-out 0.55s both" }
              : { opacity: 0 }
          }
        >
          환영합니다! 🎉
        </h1>
        <p
          className="text-gray-500 text-sm"
          style={
            animStart
              ? { animation: "auth-fade-up 0.5s ease-out 0.72s both" }
              : { opacity: 0 }
          }
        >
          율무일기로 이동 중...
        </p>

        {/* ── 진행 바: DISPLAY_MS와 동일한 속도로 채워짐 ── */}
        <div className="mt-10 w-48 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          {animStart && (
            <div
              className="h-full w-full bg-primary-500 rounded-full origin-left"
              style={{
                animation: `auth-fill-bar ${DISPLAY_MS}ms linear both`,
              }}
            />
          )}
        </div>
      </div>
    </>
  );
}

export default function AuthSuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  );
}
