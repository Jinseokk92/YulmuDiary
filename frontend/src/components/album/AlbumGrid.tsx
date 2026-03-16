"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { api } from "@/lib/api";
import type { AlbumPhotoPageResponse, AlbumPhotoResponse, GrowthPhaseType } from "@/types";
import { getMediaUrl } from "@/lib/utils";

// ─── 상수 ────────────────────────────────────────────────────────────────────
const BABY_ID = 1;
const PAGE_SIZE = 20;

// ─── 필터 타입 ────────────────────────────────────────────────────────────────
// 저장값(growthPhaseType + growthIndex)과 UI 레이블을 분리.
// 범위 필터는 API의 fromIndex + toIndex로 변환되고, 정확값 필터는 growthIndex로 변환된다.

type FilterMode =
  | { type: "all" }
  | { type: "exact"; phase: GrowthPhaseType; index: number }
  | { type: "range"; phase: GrowthPhaseType; fromIndex: number; toIndex: number };

interface FilterOption {
  id: string;
  label: string;
  mode: FilterMode;
}

// 임신: 초기(1~13주) / 중기(14~27주) / 후기(28~41주)
// 출산 후: 신생아(0개월), 1~12개월
// 이 배열만 수정하면 필터 항목을 자유롭게 추가·제거 가능
const FILTER_OPTIONS: FilterOption[] = [
  { id: "all",    label: "전체",    mode: { type: "all" } },
  { id: "p-early", label: "임신 초기", mode: { type: "range", phase: "PREGNANCY", fromIndex: 1,  toIndex: 13 } },
  { id: "p-mid",   label: "임신 중기", mode: { type: "range", phase: "PREGNANCY", fromIndex: 14, toIndex: 27 } },
  { id: "p-late",  label: "임신 후기", mode: { type: "range", phase: "PREGNANCY", fromIndex: 28, toIndex: 41 } },
  { id: "b-0",  label: "신생아", mode: { type: "exact", phase: "BABY", index: 0  } },
  { id: "b-1",  label: "1개월",  mode: { type: "exact", phase: "BABY", index: 1  } },
  { id: "b-2",  label: "2개월",  mode: { type: "exact", phase: "BABY", index: 2  } },
  { id: "b-3",  label: "3개월",  mode: { type: "exact", phase: "BABY", index: 3  } },
  { id: "b-4",  label: "4개월",  mode: { type: "exact", phase: "BABY", index: 4  } },
  { id: "b-5",  label: "5개월",  mode: { type: "exact", phase: "BABY", index: 5  } },
  { id: "b-6",  label: "6개월",  mode: { type: "exact", phase: "BABY", index: 6  } },
  { id: "b-9",  label: "9개월",  mode: { type: "exact", phase: "BABY", index: 9  } },
  { id: "b-12", label: "12개월", mode: { type: "exact", phase: "BABY", index: 12 } },
];

// ─── 쿼리 파라미터 빌더 ───────────────────────────────────────────────────────
function buildParams(filter: FilterOption, cursor: number | null): URLSearchParams {
  const params = new URLSearchParams({
    babyId: String(BABY_ID),
    size: String(PAGE_SIZE),
  });
  if (cursor != null) params.set("cursor", String(cursor));

  const { mode } = filter;
  if (mode.type === "exact") {
    params.set("growthPhaseType", mode.phase);
    params.set("growthIndex", String(mode.index));
  } else if (mode.type === "range") {
    params.set("growthPhaseType", mode.phase);
    params.set("fromIndex", String(mode.fromIndex));
    params.set("toIndex", String(mode.toIndex));
  }
  // type === "all" → 추가 파라미터 없음
  return params;
}

// ─── 컴포넌트 ─────────────────────────────────────────────────────────────────

interface AlbumGridProps {
  initialData: AlbumPhotoPageResponse;
}

export default function AlbumGrid({ initialData }: AlbumGridProps) {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const [activeFilter, setActiveFilter] = useState<FilterOption>(FILTER_OPTIONS[0]);
  // loadMore에서 최신 activeFilter를 클로저 없이 참조하기 위한 ref
  const activeFilterRef = useRef<FilterOption>(FILTER_OPTIONS[0]);

  const [photos, setPhotos] = useState<AlbumPhotoResponse[]>(initialData.items);
  const [cursor, setCursor] = useState<number | null>(initialData.nextCursor);
  const [hasNext, setHasNext] = useState(initialData.hasNext);
  const [loading, setLoading] = useState(false);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

  useEffect(() => { setMounted(true); }, []);

  // ── 필터 변경 시: 리셋 + 첫 페이지 재요청 ──────────────────────────────────
  useEffect(() => {
    activeFilterRef.current = activeFilter;

    // 첫 렌더링은 initialData로 이미 채워져 있으므로 스킵
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    let cancelled = false;

    // loading = true → loadMore의 early return 보장
    setLoading(true);
    setPhotos([]);
    setCursor(null);
    setHasNext(false);

    const params = buildParams(activeFilter, null);
    api.get<AlbumPhotoPageResponse>(`/api/album-photos?${params}`)
      .then((data) => {
        if (cancelled) return;
        setPhotos(data.items);
        setCursor(data.nextCursor);
        setHasNext(data.hasNext);
      })
      .catch(() => { if (!cancelled) setHasNext(false); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [activeFilter]);

  // ── 무한스크롤: 다음 페이지 로드 ────────────────────────────────────────────
  const loadMore = useCallback(async () => {
    if (loading || !hasNext) return;
    setLoading(true);
    try {
      const params = buildParams(activeFilterRef.current, cursor);
      const data = await api.get<AlbumPhotoPageResponse>(`/api/album-photos?${params}`);
      setPhotos((prev) => [...prev, ...data.items]);
      setCursor(data.nextCursor);
      setHasNext(data.hasNext);
    } catch {
      setHasNext(false);
    } finally {
      setLoading(false);
    }
  }, [loading, hasNext, cursor]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMore(); },
      { rootMargin: "120px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  // ── 테마 토큰 ────────────────────────────────────────────────────────────────
  const isDark = mounted && resolvedTheme === "dark";
  const titleColor   = isDark ? "text-slate-100"  : "text-gray-900";
  const subColor     = isDark ? "text-slate-500"  : "text-gray-400";
  const loadingTone = isDark ? "bg-slate-950/35" : "bg-slate-50/35";
  const chipBase     = isDark ? "bg-slate-800 text-slate-300 border border-slate-700"
                              : "bg-white text-gray-600 border border-gray-200";
  const chipActive   = "bg-emerald-500 text-white border border-emerald-500";
  const scrollBg     = isDark ? "bg-slate-950"    : "bg-white";
  const divider      = isDark ? "border-slate-800" : "border-gray-100";

  return (
    <div>
      {/* ── 페이지 헤더 ─────────────────────────────────────────────────────── */}
      <div className="px-4 pt-4 pb-3">
        <h1 className={`text-base font-bold ${titleColor}`}>앨범</h1>
        <p className={`text-xs mt-0.5 ${subColor}`}>임신·성장 사진 모아보기</p>
      </div>

      {/* ── 필터 탭 ─────────────────────────────────────────────────────────── */}
      <div className={`sticky top-0 z-10 ${scrollBg} border-b ${divider}`}>
        <div className="flex gap-2 px-4 py-2 overflow-x-auto scrollbar-none">
          {FILTER_OPTIONS.map((option) => {
            const isActive = activeFilter.id === option.id;
            return (
              <button
                key={option.id}
                onClick={() => setActiveFilter(option)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium
                           transition-colors active:opacity-75
                           ${isActive ? chipActive : chipBase}`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 콘텐츠 ──────────────────────────────────────────────────────────── */}
      {loading && photos.length === 0 ? (
        /* 필터 전환 로딩 — 스켈레톤 그리드 */
        <div className={`grid grid-cols-3 gap-0 album-skeleton-soft ${loadingTone}`}>
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className={`aspect-square ${loadingTone}`} />
          ))}
        </div>
      ) : photos.length === 0 ? (
        /* 빈 상태 */
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center
                          ${isDark ? "bg-slate-800" : "bg-emerald-50"}`}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-8 h-8 text-emerald-400"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
              />
            </svg>
          </div>
          <p className={`text-sm font-medium ${subColor}`}>사진이 없어요</p>
          <p className={`text-xs text-center ${subColor}`}>
            {activeFilter.id === "all"
              ? "소중한 순간을 앨범에 담아보세요"
              : `'${activeFilter.label}' 사진이 아직 없어요`}
          </p>
        </div>
      ) : (
        <>
          {/* 3열 그리드 */}
          <div className="grid grid-cols-3 gap-px">
            {photos.map((photo) => (
              <button
                key={photo.id}
                onClick={() => router.push(`/album/${photo.id}`)}
                className="relative aspect-square overflow-hidden bg-gray-200 active:opacity-75 transition-opacity"
              >
                {(() => {
                  const src = getMediaUrl(photo.thumbnailUrl ?? photo.url);
                  return (
                    <Image
                      src={src}
                      alt={photo.caption ?? "앨범 사진"}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 33vw, 200px"
                      unoptimized={
                        src.startsWith("http://localhost") ||
                        src.startsWith("data:") ||
                        src.startsWith("blob:")
                      }
                    />
                  );
                })()}
              </button>
            ))}
          </div>

          {/* 무한스크롤 센티넬 */}
          <div ref={sentinelRef} className="h-12 flex items-center justify-center">
            {loading && (
              <div className="w-5 h-5 border-2 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
            )}
          </div>
        </>
      )}
    </div>
  );
}
