"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { api } from "@/lib/api";
import { HOME_BGM_ANCHOR_ID } from "@/components/BgmPlayerUI";
import FloatingYulmu from "@/components/FloatingYulmu";
import type { BabyResponse } from "@/types";

const BABY_ID = 1;
const LS_DDAY = "home_dday";
const LS_PREGNANCY = "home_pregnancy";

export default function Home() {
  const HERO_FRAME_WIDTH = 184;
  const HERO_FRAME_HEIGHT = 188;
  const HERO_ANCHOR_OFFSET_X = 4;
  const HERO_ANCHOR_OFFSET_Y = 104;

  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [dday, setDday]                         = useState<string | null>(null);
  const [pregnancyDisplay, setPregnancyDisplay] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);

    // 캐시된 값을 즉시 표시
    const cachedDday = localStorage.getItem(LS_DDAY);
    const cachedPregnancy = localStorage.getItem(LS_PREGNANCY);
    if (cachedDday) setDday(cachedDday);
    if (cachedPregnancy) setPregnancyDisplay(cachedPregnancy);

    // API 호출 후 최신값으로 갱신 + 캐시 업데이트
    api.get<BabyResponse>(`/api/babies/${BABY_ID}`)
      .then((baby) => {
        const { dDayCount, pregnancyWeeks, pregnancyDays } = baby;
        // D-day 표시: 양수=D-N(미래), 0=D-Day, 음수=D+N(과거)
        const ddayStr = dDayCount === 0 ? "D-Day"
          : dDayCount > 0 ? `D-${dDayCount}`
          : `D+${Math.abs(dDayCount)}`;
        const pregnancyStr = pregnancyDays === 0
          ? `${pregnancyWeeks}주`
          : `${pregnancyWeeks}주 ${pregnancyDays}일`;
        setDday(ddayStr);
        setPregnancyDisplay(pregnancyStr);
        localStorage.setItem(LS_DDAY, ddayStr);
        localStorage.setItem(LS_PREGNANCY, pregnancyStr);
      })
      .catch(() => {});
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  const card     = isDark ? "bg-slate-900/80 border border-slate-800" : "bg-white/90 border border-white/60";
  const sub      = isDark ? "text-slate-400" : "text-gray-400";
  const title    = isDark ? "text-slate-100" : "text-gray-900";
  const desc     = isDark ? "text-slate-500" : "text-gray-400";
  const label    = isDark ? "text-slate-200" : "text-gray-800";
  const skelCls  = `inline-block rounded align-middle animate-pulse ${isDark ? "bg-slate-700" : "bg-gray-200"}`;

  return (
    <div className="px-4 py-6 space-y-4">
      {/* 상단: D-day 카드 */}
      <section className={`${card} rounded-2xl p-6 shadow-sm text-center backdrop-blur-sm`}>
        <p className={`text-sm ${sub} mb-1`}>율무와 만날 때까지</p>
        <h2 className={`text-2xl font-bold ${title}`}>
          임신{" "}
          <span className="text-primary-500">
            {pregnancyDisplay != null
              ? pregnancyDisplay
              : <span className={`${skelCls} w-14 h-5`} />}
          </span>
          차
        </h2>
        <p className="mt-2 text-xl font-bold text-primary-500">
          {dday != null
            ? dday
            : <span className={`${skelCls} w-12 h-5`} />}
        </p>
      </section>

      {/* 중앙: 율무 캐릭터 */}
      <section className="flex justify-center">
        <div
          className="relative overflow-visible"
          style={{ width: HERO_FRAME_WIDTH, height: HERO_FRAME_HEIGHT }}
        >
          <div
            id={HOME_BGM_ANCHOR_ID}
            className="absolute z-[60] h-0 w-0 overflow-visible"
            style={{ left: HERO_ANCHOR_OFFSET_X, top: HERO_ANCHOR_OFFSET_Y }}
          />
          {/* 살구색 원형 발판 배경 */}
          <div
            className={`absolute bottom-0 left-1/2 w-36 h-36 -translate-x-1/2 rounded-full border-4 shadow-lg
                        ${isDark
                          ? "bg-gradient-to-br from-slate-800 to-slate-700 border-slate-900"
                          : "bg-gradient-to-br from-primary-100 to-primary-50 border-white"
                        }`}
          />
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
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
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
              strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-primary-500">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
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
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
              strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-blue-500">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
          </div>
          <div className="text-center">
            <p className={`text-sm font-semibold ${label}`}>일정</p>
            <p className={`text-xs ${desc} mt-0.5`}>예정일 & 이벤트</p>
          </div>
        </Link>

        <Link
          href="/album"
          className={`col-span-2 flex items-center gap-4 ${card} rounded-2xl px-5 py-4 shadow-sm
                     hover:shadow-md active:scale-[0.98] transition-all backdrop-blur-sm`}
        >
          <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0
                          ${isDark ? "bg-slate-800" : "bg-emerald-50"}`}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
              strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-emerald-500">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold ${label}`}>앨범</p>
            <p className={`text-xs ${desc} mt-0.5`}>임신·성장 사진 모아보기</p>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
            strokeWidth={2} stroke="currentColor" className={`w-4 h-4 shrink-0 ${sub}`}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </Link>

        <Link
          href="/milestones"
          className={`col-span-2 flex items-center gap-4 ${card} rounded-2xl px-5 py-4 shadow-sm
                     hover:shadow-md active:scale-[0.98] transition-all backdrop-blur-sm`}
        >
          <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0
                          ${isDark ? "bg-slate-800" : "bg-violet-50"}`}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
              strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-violet-500">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold ${label}`}>이정표</p>
            <p className={`text-xs ${desc} mt-0.5`}>율무의 성장 여정</p>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
            strokeWidth={2} stroke="currentColor" className={`w-4 h-4 shrink-0 ${sub}`}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </Link>
      </section>
    </div>
  );
}
