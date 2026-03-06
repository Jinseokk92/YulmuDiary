"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { calcDday, calcLmpFromDueDate, calcPregnancyWeek } from "@/lib/utils";
import FloatingYulmu from "@/components/FloatingYulmu";

// ─── 날짜 상수 ─────────────────────────────────────────────────────────────
// 출산 예정일만 수정하면 LMP(마지막 생리일)와 모든 계산이 자동으로 갱신됩니다.
const YULMU_DUE_DATE = "2026-06-27"; // 출산 예정일 (YYYY-MM-DD)

export default function Home() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // SSR ↔ 클라이언트 Hydration 불일치 방지: 마운트 후 클라이언트에서만 계산
  const [dday, setDday]                         = useState<string | null>(null);
  const [pregnancyDisplay, setPregnancyDisplay] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    // D-day: 출산 예정일 기준
    setDday(calcDday(YULMU_DUE_DATE));
    // 임신 주수: 출산 예정일에서 LMP를 역산(−280일)하여 경과 기간 계산
    const lmp = calcLmpFromDueDate(YULMU_DUE_DATE);
    const { weeks, days } = calcPregnancyWeek(lmp);
    setPregnancyDisplay(days === 0 ? `${weeks}주` : `${weeks}주 ${days}일`);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  // 테마별 색상 토큰
  const card  = isDark ? "bg-slate-900/80 border border-slate-800" : "bg-white/90 border border-white/60";
  const sub   = isDark ? "text-slate-400" : "text-gray-400";
  const title = isDark ? "text-slate-100" : "text-gray-900";
  const desc  = isDark ? "text-slate-500" : "text-gray-400";
  const label = isDark ? "text-slate-200" : "text-gray-800";

  return (
    <div className="px-4 py-6 space-y-4">
      {/* 상단: D-day 카드 */}
      <section className={`${card} rounded-2xl p-6 shadow-sm text-center backdrop-blur-sm`}>
        <p className={`text-sm ${sub} mb-1`}>율무와 만날 때까지</p>
        <h2 className={`text-2xl font-bold ${title}`}>
          임신{" "}
          <span className="text-primary-500">
            {pregnancyDisplay ?? "···"}
          </span>
          차
        </h2>
        <p className="mt-2 text-xl font-bold text-primary-500">
          {dday ?? "···"}
        </p>
      </section>

      {/* 중앙: 율무 캐릭터 — 살구색 원형 배경 위에 둥둥 */}
      <section className="flex justify-center">
        <div className="relative flex items-end justify-center">
          {/* 살구색 원형 발판 배경 */}
          <div
            className={`w-36 h-36 rounded-full border-4 shadow-lg
                        ${isDark
                          ? "bg-gradient-to-br from-slate-800 to-slate-700 border-slate-900"
                          : "bg-gradient-to-br from-primary-100 to-primary-50 border-white"
                        }`}
          />
          {/* FloatingYulmu: 원형 배경 중앙 기준으로 절대 배치 */}
          <div className="absolute bottom-2">
            <FloatingYulmu
              src="/icons/Yulmu_Logo.png"
              width={120}
              height={180}
            />
          </div>
        </div>
      </section>

      {/* 하단: 퀵 메뉴 */}
      <section className="grid grid-cols-2 gap-3">
        <Link
          href="/diary"
          className={`flex flex-col items-center gap-3 ${card} rounded-2xl p-5 shadow-sm
                     hover:shadow-md active:scale-[0.98] transition-all backdrop-blur-sm`}
        >
          <div className={`w-12 h-12 rounded-full flex items-center justify-center
                          ${isDark ? "bg-slate-800" : "bg-primary-50"}`}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6 text-primary-500"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
              />
            </svg>
          </div>
          <div className="text-center">
            <p className={`text-sm font-semibold ${label}`}>일기장</p>
            <p className={`text-xs ${desc} mt-0.5`}>성장 기록 보기</p>
          </div>
        </Link>

        <Link
          href="/schedule"
          className={`flex flex-col items-center gap-3 ${card} rounded-2xl p-5 shadow-sm
                     hover:shadow-md active:scale-[0.98] transition-all backdrop-blur-sm`}
        >
          <div className={`w-12 h-12 rounded-full flex items-center justify-center
                          ${isDark ? "bg-slate-800" : "bg-blue-50"}`}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6 text-blue-500"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
              />
            </svg>
          </div>
          <div className="text-center">
            <p className={`text-sm font-semibold ${label}`}>일정</p>
            <p className={`text-xs ${desc} mt-0.5`}>예정일 & 이벤트</p>
          </div>
        </Link>
      </section>
    </div>
  );
}
