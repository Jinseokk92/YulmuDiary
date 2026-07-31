"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { Pin, Trophy } from "lucide-react";
import Image from "next/image";
import { api } from "@/lib/api";
import { HOME_BGM_ANCHOR_ID } from "@/components/BgmPlayerUI";
import FloatingYulmu from "@/components/FloatingYulmu";
import PinnedPostsModal from "@/components/diary/PinnedPostsModal";
import VotingModal from "@/components/bestphoto/VotingModal";
import ResultModal from "@/components/bestphoto/ResultModal";
import { getMediaUrl } from "@/lib/utils";
import { darkPalette } from "@/lib/theme/darkPalette";
import type { BabyResponse, DiaryPostResponse, BestPhotoStatusResponse } from "@/types";

const BABY_ID = 1;
// v2: 출산 후 상태를 함께 캐싱한다. 캐시 스키마가 바뀌었으므로 키를 버전업해
// 예전 임신 캐시(home_dday/home_pregnancy)가 출산 후 화면에 섞여 들어오지 않게 한다.
const LS_HOME_CACHE = "home_baby_cache_v2";

interface HomeBabyCache {
  born: boolean;
  dday?: string;
  pregnancyDisplay?: string;
  babyName?: string;
  ageWeeks?: number;
  ageRemainDays?: number;
  ageDays?: number;
  profileImageUrl?: string | null;
}

export default function Home() {
  const HERO_FRAME_WIDTH = 184;
  const HERO_FRAME_HEIGHT = 188;
  const HERO_ANCHOR_OFFSET_X = 4;
  const HERO_ANCHOR_OFFSET_Y = 104;

  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [dday, setDday]                         = useState<string | null>(null);
  const [pregnancyDisplay, setPregnancyDisplay] = useState<string | null>(null);
  const [pregnancyProgress, setPregnancyProgress] = useState<number | null>(null);
  const [born, setBorn] = useState(false);
  const [babyName, setBabyName] = useState<string | null>(null);
  const [ageWeeks, setAgeWeeks] = useState<number | null>(null);
  const [ageRemainDays, setAgeRemainDays] = useState<number | null>(null);
  const [ageDays, setAgeDays] = useState<number | null>(null);
  const [babyProfileImageUrl, setBabyProfileImageUrl] = useState<string | null>(null);
  const [pinnedPosts, setPinnedPosts] = useState<DiaryPostResponse[]>([]);
  const [pinnedModalOpen, setPinnedModalOpen] = useState(false);
  const [bestPhotoStatus, setBestPhotoStatus] = useState<BestPhotoStatusResponse | null>(null);
  const [bestPhotoModalOpen, setBestPhotoModalOpen] = useState(false);

  useEffect(() => {
    setMounted(true);

    // 캐시된 값을 즉시 표시
    try {
      const cachedRaw = localStorage.getItem(LS_HOME_CACHE);
      if (cachedRaw) {
        const cached: HomeBabyCache = JSON.parse(cachedRaw);
        if (cached.born) {
          setBorn(true);
          setBabyName(cached.babyName ?? null);
          setAgeWeeks(cached.ageWeeks ?? null);
          setAgeRemainDays(cached.ageRemainDays ?? null);
          setAgeDays(cached.ageDays ?? null);
          setBabyProfileImageUrl(cached.profileImageUrl ?? null);
        } else {
          if (cached.dday) setDday(cached.dday);
          if (cached.pregnancyDisplay) setPregnancyDisplay(cached.pregnancyDisplay);
        }
      }
    } catch {}

    // 아기 정보 + 고정 글 동시 요청
    api.get<BabyResponse>(`/api/babies/${BABY_ID}`)
      .then((baby) => {
        if (baby.born) {
          setBorn(true);
          setBabyName(baby.name);
          setAgeWeeks(baby.ageWeeks);
          setAgeRemainDays(baby.ageRemainDays);
          setAgeDays(baby.ageDays);
          setBabyProfileImageUrl(baby.profileImageUrl);
          const cache: HomeBabyCache = {
            born: true,
            babyName: baby.name,
            ageWeeks: baby.ageWeeks,
            ageRemainDays: baby.ageRemainDays,
            ageDays: baby.ageDays,
            profileImageUrl: baby.profileImageUrl,
          };
          localStorage.setItem(LS_HOME_CACHE, JSON.stringify(cache));
          return;
        }

        setBorn(false);
        const { dDayCount, pregnancyWeeks, pregnancyDays } = baby;
        const ddayStr = dDayCount === 0 ? "D-Day"
          : dDayCount > 0 ? `D-${dDayCount}`
          : `D+${Math.abs(dDayCount)}`;
        const pregnancyStr = pregnancyDays === 0
          ? `${pregnancyWeeks}주`
          : `${pregnancyWeeks}주 ${pregnancyDays}일`;
        const elapsedDays = baby.pregnancyWeeks * 7 + baby.pregnancyDays;
        const progressPct = Math.min(100, Math.round((elapsedDays / 280) * 100));
        setDday(ddayStr);
        setPregnancyDisplay(pregnancyStr);
        setPregnancyProgress(progressPct);
        const cache: HomeBabyCache = { born: false, dday: ddayStr, pregnancyDisplay: pregnancyStr };
        localStorage.setItem(LS_HOME_CACHE, JSON.stringify(cache));
      })
      .catch(() => {});

    api.get<DiaryPostResponse[]>(`/api/diary-posts/pinned?babyId=${BABY_ID}`)
      .then((posts) => { if (Array.isArray(posts)) setPinnedPosts(posts); })
      .catch(() => {});

    api.get<BestPhotoStatusResponse>("/api/best-photo/status")
      .then((s) => { if (s?.status && s.status !== "NONE") setBestPhotoStatus(s); })
      .catch(() => {});
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  const card     = isDark ? "bg-[#121212]/90 border border-[#262626]" : "bg-white/90 border border-white/60";
  const sub      = isDark ? "text-[#A8A8A8]" : "text-gray-400";
  const title    = isDark ? "text-[#F5F5F5]" : "text-gray-900";
  const desc     = isDark ? "text-[#737373]" : "text-gray-400";
  const label    = isDark ? "text-[#F5F5F5]" : "text-gray-800";
  const skelCls  = `inline-block rounded align-middle animate-pulse ${isDark ? "bg-[#262626]" : "bg-gray-200"}`;

  return (
    <div className="px-4 py-6 space-y-4">
      {/* 상단: D-day 카드 */}
      <section className={`${card} rounded-2xl p-6 shadow-sm text-center backdrop-blur-sm`}>
        {born ? (
          <>
            <p className={`text-sm ${sub} mb-1`}>{babyName ?? "율무"}와 만난 지</p>
            <h2 className={`text-2xl font-bold ${title}`}>
              생후{" "}
              <span className="text-primary-500">
                {ageWeeks != null && ageRemainDays != null
                  ? `${ageWeeks}주 ${ageRemainDays}일`
                  : <span className={`${skelCls} w-14 h-5`} />}
              </span>
              차
            </h2>
            <p className="mt-2 text-xl font-bold text-primary-500">
              {ageDays != null
                ? `D+${ageDays}`
                : <span className={`${skelCls} w-12 h-5`} />}
            </p>
          </>
        ) : (
          <>
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
          </>
        )}

        {/* 임신 진행률 프로그레스바 (출산 전에만 노출) */}
        {!born && pregnancyProgress !== null && (() => {
          const clampedPct = Math.max(3, Math.min(97, pregnancyProgress));
          return (
            <div className="mt-5">
              {/* 라벨 행 — text-xs(rem)로 font-large 모드 대응 */}
              <div className="flex justify-between items-center mb-2">
                <span className={`text-xs ${sub}`}>임신 시작</span>
                <span className="text-xs font-bold text-primary-500">
                  {pregnancyProgress}%
                </span>
                <span className={`text-xs ${sub}`}>출산 예정</span>
              </div>

              {/* 아이콘 + 입체 바 */}
              <div className="relative pt-8">
                {/* 이모지 아이콘 */}
                <motion.div
                  className="absolute top-0 z-10"
                  initial={{ left: "0%" }}
                  animate={{ left: `${clampedPct}%` }}
                  transition={{ duration: 1.3, ease: "easeOut" }}
                >
                  {/* translateX(-50%) 는 framer 내부 transform 충돌 방지를 위해 자식 div에서 처리 */}
                  <div className="-translate-x-1/2 leading-none select-none text-[1.6rem]"
                       role="img" aria-label="젖병">
                    🍼
                  </div>
                </motion.div>

                {/* 트랙 — inset shadow로 홈파인 느낌 */}
                <div
                  className="relative h-4 rounded-full overflow-hidden"
                  style={{
                    background: isDark ? darkPalette.surfaceSecondary : "#ffedd5",
                    boxShadow: isDark
                      ? "inset 0 2px 4px rgba(0,0,0,0.55), inset 0 1px 2px rgba(0,0,0,0.35)"
                      : "inset 0 2px 3px rgba(0,0,0,0.1), inset 0 1px 2px rgba(0,0,0,0.06)",
                  }}
                >
                  {/* 진행 바 — 상단 하이라이트 + drop glow로 입체감 */}
                  <motion.div
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{
                      background: isDark
                        ? "linear-gradient(to bottom, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 52%), linear-gradient(to right, #fb923c, #c2410c)"
                        : "linear-gradient(to bottom, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0) 52%), linear-gradient(to right, #fdba74, #ea580c)",
                      boxShadow: isDark
                        ? "0 2px 8px rgba(249,115,22,0.55), inset 0 1px 0 rgba(255,255,255,0.2)"
                        : "0 2px 10px rgba(234,88,12,0.3), inset 0 1px 0 rgba(255,255,255,0.55)",
                    }}
                    initial={{ width: "0%" }}
                    animate={{ width: `${pregnancyProgress}%` }}
                    transition={{ duration: 1.3, ease: "easeOut" }}
                  />
                </div>
              </div>
            </div>
          );
        })()}
      </section>

      {/* 중앙: 율무 캐릭터 + 핀 아이콘 */}
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

          {/* 핀 아이콘 — BGM 토큰 반대편(우측), 고정 글 없으면 숨김 */}
          <AnimatePresence>
            {pinnedPosts.length > 0 && (
              <motion.button
                className="absolute z-[60]"
                style={{ right: HERO_ANCHOR_OFFSET_X, top: HERO_ANCHOR_OFFSET_Y - 6 }}
                onClick={() => setPinnedModalOpen(true)}
                aria-label="고정된 일기 보기"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 22 }}
              >
                <div className={`relative flex items-center justify-center w-9 h-9 rounded-full shadow-md
                  ${isDark
                    ? "bg-[#1A1A1A] border border-[#262626]"
                    : "bg-white border border-primary-100"}`}
                >
                  <Pin size={17} className="text-primary-500" fill="currentColor" />
                  {/* 개수 배지 */}
                  <span className="absolute -top-1 -right-1 w-[18px] h-[18px] bg-primary-500 text-white
                    text-[10px] rounded-full flex items-center justify-center font-bold leading-none">
                    {pinnedPosts.length}
                  </span>
                </div>
              </motion.button>
            )}
          </AnimatePresence>

          {born && babyProfileImageUrl ? (
            /* 실제 아기 대표 사진 — 애니메이션 없이 원형 프레임에 정적으로 고정 */
            <div
              className={`absolute bottom-0 left-1/2 w-36 h-36 -translate-x-1/2 rounded-full overflow-hidden border-4 shadow-lg
                          ${isDark ? "border-black" : "border-white"}`}
            >
              <Image
                src={getMediaUrl(babyProfileImageUrl)}
                alt={babyName ? `${babyName} 사진` : "아기 사진"}
                fill
                sizes="144px"
                className="object-cover object-center"
                priority
              />
            </div>
          ) : (
            <>
              {/* 살구색 원형 발판 배경 */}
              <div
                className={`absolute bottom-0 left-1/2 w-36 h-36 -translate-x-1/2 rounded-full border-4 shadow-lg
                            ${isDark
                              ? "bg-gradient-to-br from-[#1A1A1A] to-[#121212] border-black"
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
            </>
          )}
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
                          ${isDark ? "bg-primary-500/10" : "bg-primary-50"}`}>
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
                          ${isDark ? "bg-blue-500/10" : "bg-blue-50"}`}>
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
                          ${isDark ? "bg-emerald-500/10" : "bg-emerald-50"}`}>
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

        {/* 베스트 포토 카드 (진행 중일 때만) */}
        {bestPhotoStatus && (
          <button
            onClick={() => setBestPhotoModalOpen(true)}
            className={`col-span-2 flex items-center gap-4 rounded-2xl px-5 py-4 shadow-sm
                       hover:shadow-md active:scale-[0.98] transition-all backdrop-blur-sm text-left
                       ${isDark
                         ? "bg-amber-900/20 border border-amber-800/40"
                         : "bg-amber-50/90 border border-amber-200/60"}`}
          >
            {/* 우승/진행 사진 미리보기 */}
            {bestPhotoStatus.status === "RESULT" && bestPhotoStatus.result ? (
              <div className="relative w-12 h-12 rounded-full overflow-hidden shrink-0 ring-2 ring-amber-400">
                <Image
                  src={getMediaUrl(bestPhotoStatus.result.winnerAlbumPhotoThumbnailUrl ?? bestPhotoStatus.result.winnerAlbumPhotoUrl)}
                  alt="베스트 포토"
                  fill
                  className="object-cover"
                  sizes="48px"
                  unoptimized
                />
              </div>
            ) : (
              <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0
                              ${isDark ? "bg-amber-900/40" : "bg-amber-100"}`}>
                <Trophy size={22} className="text-amber-500" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold ${label}`}>
                {bestPhotoStatus.status === "NOMINATING" && "베스트 포토 추천 중"}
                {bestPhotoStatus.status === "VOTING" && "베스트 포토 투표 중 🗳️"}
                {bestPhotoStatus.status === "RESULT" && "이달의 베스트 포토 🏆"}
              </p>
              <p className={`text-xs ${desc} mt-0.5`}>
                {bestPhotoStatus.status === "NOMINATING" && `${bestPhotoStatus.totalNominations}장 추천됨 · 앨범에서 추천하기`}
                {bestPhotoStatus.status === "VOTING" && (bestPhotoStatus.hasVoted ? "투표 완료 · 결과 기다리는 중" : `${bestPhotoStatus.nominations.length}장 중 투표하기`)}
                {bestPhotoStatus.status === "RESULT" && `${bestPhotoStatus.result?.winnerVoteCount ?? 0}표로 선정!`}
              </p>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
              strokeWidth={2} stroke="currentColor" className={`w-4 h-4 shrink-0 ${sub}`}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        )}

        <Link
          href="/milestones"
          className={`col-span-2 flex items-center gap-4 ${card} rounded-2xl px-5 py-4 shadow-sm
                     hover:shadow-md active:scale-[0.98] transition-all backdrop-blur-sm`}
        >
          <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0
                          ${isDark ? "bg-violet-500/10" : "bg-violet-50"}`}>
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

      {/* 고정 일기 모달 */}
      <AnimatePresence>
        {pinnedModalOpen && (
          <PinnedPostsModal
            posts={pinnedPosts}
            onClose={() => setPinnedModalOpen(false)}
            isDark={isDark}
          />
        )}
      </AnimatePresence>

      {/* 베스트 포토 투표 모달 */}
      <AnimatePresence>
        {bestPhotoModalOpen && bestPhotoStatus?.status === "VOTING" && bestPhotoStatus.roundId && (
          <VotingModal
            roundId={bestPhotoStatus.roundId}
            nominations={bestPhotoStatus.nominations}
            hasVoted={bestPhotoStatus.hasVoted}
            votedNominationId={bestPhotoStatus.votedNominationId}
            isDark={isDark}
            onClose={() => setBestPhotoModalOpen(false)}
            onVoted={(id) => setBestPhotoStatus((prev) => prev ? { ...prev, hasVoted: true, votedNominationId: id } : prev)}
          />
        )}
      </AnimatePresence>

      {/* 베스트 포토 결과 모달 */}
      <AnimatePresence>
        {bestPhotoModalOpen && bestPhotoStatus?.status === "RESULT" && bestPhotoStatus.result && (
          <ResultModal
            result={bestPhotoStatus.result}
            isDark={isDark}
            onClose={() => setBestPhotoModalOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
