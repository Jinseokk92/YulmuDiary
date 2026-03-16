"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Images } from "lucide-react";
import type { MediaDto } from "@/types";
import { getMediaUrl } from "@/lib/utils";
import { useUiStore } from "@/stores/uiStore";

interface ImageCarouselProps {
  media: MediaDto[];
  diaryId: number;
  /** 싱글탭 시 호출 — 뷰어 열기 등. 제공되면 탭 감지에 280ms 지연이 생긴다. */
  onImageClick?: (index: number) => void;
  /** 더블탭 시 호출 — 좋아요 토글 등. */
  onDoubleTap?: () => void;
}

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? "100%" : "-100%",
  }),
  center: {
    x: 0,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? "-100%" : "100%",
  }),
};

const springTransition = {
  type: "spring",
  stiffness: 300,
  damping: 30,
} as const;

export default function ImageCarousel({
  media,
  diaryId,
  onImageClick,
  onDoubleTap,
}: ImageCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [imgErrors, setImgErrors] = useState<Record<number, boolean>>({});

  const demoGuideStep = useUiStore((s) => s.demoGuideStep);
  const setDemoGuideStep = useUiStore((s) => s.setDemoGuideStep);

  // ── 체험판 blob URL 깨짐 감지 ────────────────────────────────────────────
  // next/image의 onError가 blob URL에 대해 신뢰할 수 없으므로
  // 마운트 시 native Image probe로 직접 검사 (next/image 우회)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("demoMode") !== "true") return;
    if (sessionStorage.getItem("demo_guide_skipped") === "true") return;

    media.forEach((m, idx) => {
      const url = getMediaUrl(m.thumbnailUrl || m.url);
      if (!url.startsWith("blob:")) return;

      const probe = new window.Image();
      probe.onerror = () => {
        console.log("[ImageCarousel] probe: blob URL 로드 실패 →", url);
        setImgErrors((prev) => ({ ...prev, [idx]: true }));
        // getState()로 최신 상태 확인 (클로저 stale 방지)
        if (useUiStore.getState().demoGuideStep === 0) {
          setDemoGuideStep(1);
        }
      };
      probe.onload = () => {
        console.log("[ImageCarousel] probe: blob URL 정상 →", url);
      };
      probe.src = url;
    });
  // media prop이 바뀔 일 없으므로 마운트 1회만 실행
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isMultiple = media.length > 1;
  const isFirst = activeIndex === 0;
  const isLast = activeIndex === media.length - 1;

  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const axisLockRef = useRef<"x" | "y" | null>(null);

  // ── 탭 감지 (싱글/더블 구분) ──────────────────────────────────────────────
  const lastTapTimeRef = useRef(0);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 컴포넌트 언마운트 시 탭 타이머 정리
  useEffect(() => {
    return () => {
      if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      axisLockRef.current = null;
    };

    const onTouchMove = (e: TouchEvent) => {
      // 이미지 영역의 touchmove를 document까지 전파하지 않음
      // → pull-to-refresh 훅이 뷰어 열리기 전 280ms 타이밍에 작동하는 것을 방지
      e.stopPropagation();

      if (!touchStartRef.current) return;
      const dx = e.touches[0].clientX - touchStartRef.current.x;
      const dy = e.touches[0].clientY - touchStartRef.current.y;

      if (axisLockRef.current === null) {
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) {
          axisLockRef.current = "x";
        } else if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 10) {
          axisLockRef.current = "y";
        }
      }

      // 수평 스와이프 확정 시 페이지 스크롤 차단
      if (axisLockRef.current === "x") {
        e.preventDefault();
      }
    };

    const onTouchEnd = () => {
      touchStartRef.current = null;
      axisLockRef.current = null;
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  // containerRef는 마운트 후 불변이므로 빈 deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const navigate = useCallback(
    (nextIndex: number) => {
      if (nextIndex === activeIndex) return;
      setDirection(nextIndex > activeIndex ? 1 : -1);
      setActiveIndex(nextIndex);
    },
    [activeIndex]
  );

  const goNext = useCallback(() => {
    if (!isLast) navigate(activeIndex + 1);
  }, [activeIndex, isLast, navigate]);

  const goPrev = useCallback(() => {
    if (!isFirst) navigate(activeIndex - 1);
  }, [activeIndex, isFirst, navigate]);

  if (media.length === 0) return null;

  return (
    <div>
      {/* ── 이미지 영역 ── */}
      <div ref={containerRef} className="relative w-full aspect-square bg-gray-100 overflow-hidden">
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={`${diaryId}-${activeIndex}`}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={springTransition}
            drag={isMultiple ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragDirectionLock
            dragElastic={{
              left: isLast ? 0.05 : 0.3,
              right: isFirst ? 0.05 : 0.3,
            }}
            onDragEnd={(_, { offset, velocity }) => {
              const swipePower = offset.x * Math.abs(velocity.x);
              if      (swipePower < -8000 || offset.x < -60) goNext();
              else if (swipePower >  8000 || offset.x >  60) goPrev();
            }}
            onTap={() => {
              // 싱글탭 vs 더블탭 구분 (280ms 윈도우)
              const now = Date.now();
              if (now - lastTapTimeRef.current < 300 && lastTapTimeRef.current > 0) {
                // 더블탭
                if (tapTimerRef.current) {
                  clearTimeout(tapTimerRef.current);
                  tapTimerRef.current = null;
                }
                lastTapTimeRef.current = 0;
                onDoubleTap?.();
              } else {
                // 첫 번째 탭 — 280ms 후에도 두 번째 탭이 없으면 싱글탭 처리
                lastTapTimeRef.current = now;
                if (onImageClick) {
                  if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
                  tapTimerRef.current = setTimeout(() => {
                    tapTimerRef.current = null;
                    onImageClick(activeIndex);
                  }, 280);
                }
              }
            }}
            className={`absolute inset-0 w-full h-full ${
              isMultiple
                ? "cursor-grab active:cursor-grabbing"
                : onImageClick
                  ? "cursor-pointer"
                  : ""
            }`}
          >
            {imgErrors[activeIndex] ? (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                <Images className="w-8 h-8 text-gray-300" />
              </div>
            ) : (() => {
              const src = getMediaUrl(media[activeIndex].thumbnailUrl || media[activeIndex].url);
              const isLocal = src.startsWith("data:") || src.startsWith("blob:");
              return (
                <Image
                  src={src}
                  alt=""
                  fill
                  draggable={false}
                  unoptimized={isLocal}
                  className="object-cover pointer-events-none select-none"
                  sizes="(max-width: 512px) 100vw, 512px"
                  onError={() => {
                    console.log("[ImageCarousel] onError 발생:", src);
                    setImgErrors((prev) => ({ ...prev, [activeIndex]: true }));
                    // blob URL 로드 실패 = 새로고침 후 체험판 이미지 깨짐
                    if (
                      src.startsWith("blob:") &&
                      demoGuideStep === 0 &&
                      sessionStorage.getItem("demoMode") === "true" &&
                      sessionStorage.getItem("demo_guide_skipped") !== "true"
                    ) {
                      setDemoGuideStep(1);
                    }
                  }}
                />
              );
            })()}
          </motion.div>
        </AnimatePresence>

        {/* 우측 상단: 다중 이미지 배지 */}
        {isMultiple && (
          <div className="absolute top-3 right-3 z-10 pointer-events-none">
            {isFirst ? (
              <div className="bg-black/40 rounded-md p-1">
                <Images className="w-4 h-4 text-white" strokeWidth={2} />
              </div>
            ) : (
              <span className="bg-black/50 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                {activeIndex + 1}/{media.length}
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── 이미지 외부 하단: Dot 인디케이터 ── */}
      {isMultiple && (
        <div className="flex justify-center items-center gap-1.5 py-2">
          {media.map((_, i) => (
            <motion.span
              key={i}
              onClick={() => navigate(i)}
              animate={{
                backgroundColor: i === activeIndex ? "#e4701e" : "#d1d5db",
                width: i === activeIndex ? 8 : 6,
                height: i === activeIndex ? 8 : 6,
              }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="rounded-full inline-block cursor-pointer"
            />
          ))}
        </div>
      )}
    </div>
  );
}
