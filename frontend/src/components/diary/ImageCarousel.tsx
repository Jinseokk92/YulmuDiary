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

const slideTransition = {
  type: "tween",
  duration: 0.25,
  ease: [0.25, 0.1, 0.25, 1],
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
        if (useUiStore.getState().demoGuideStep === 0) {
          setDemoGuideStep(1);
        }
      };
      probe.onload = () => {
        console.log("[ImageCarousel] probe: blob URL 정상 →", url);
      };
      probe.src = url;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isMultiple = media.length > 1;

  // ── stale closure 방지: activeIndex / media.length를 렌더마다 ref에 동기화 ──
  // (touchend 핸들러는 마운트 시 1회만 등록되므로, refs로 최신 값을 읽는다)
  const activeIndexRef = useRef(activeIndex);
  const mediaLengthRef = useRef(media.length);
  activeIndexRef.current = activeIndex;
  mediaLengthRef.current = media.length;

  // 콜백 refs — touchend 클로저(마운트 1회 등록)에서 최신 props를 읽기 위해
  const onImageClickRef = useRef(onImageClick);
  const onDoubleTapRef = useRef(onDoubleTap);
  onImageClickRef.current = onImageClick;
  onDoubleTapRef.current = onDoubleTap;

  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const axisLockRef = useRef<"x" | "y" | null>(null);

  // ── 탭 감지 (싱글/더블 구분) ──────────────────────────────────────────────
  const lastTapTimeRef = useRef(0);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
    };
  }, []);

  // ── 네이티브 터치 이벤트 (스와이프 + 스크롤 제어) ─────────────────────────
  // Framer Motion의 drag 시스템을 사용하지 않고 네이티브 touch로 스와이프를 처리한다.
  // 이유: Framer Motion v12의 drag + AnimatePresence 조합이 내부적으로
  //       예상치 못한 transform을 적용해 이미지가 확대되는 버그를 유발함.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        // 멀티터치 시작 시 pinch-zoom 제스처 자체를 차단
        // (touchmove에서 cancelable=false가 되기 전에 여기서 막는 것이 더 확실)
        if (e.cancelable) e.preventDefault();
        touchStartRef.current = null;
        axisLockRef.current = null;
        return;
      }
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: Date.now(),
      };
      axisLockRef.current = null;
    };

    const onTouchMove = (e: TouchEvent) => {
      // 멀티터치: pinch-zoom 차단
      // e.cancelable 체크 필수 — touch-action 또는 scroll commit 이후엔
      // cancelable=false가 되어 preventDefault()가 무시되며 Intervention 경고 발생
      if (e.touches.length > 1) {
        if (e.cancelable) e.preventDefault();
        return;
      }
      e.stopPropagation();
      if (!touchStartRef.current) return;

      const dx = e.touches[0].clientX - touchStartRef.current.x;
      const dy = e.touches[0].clientY - touchStartRef.current.y;

      // touch-action: pan-y 가 수평 브라우저 pan을 이미 차단하므로
      // 여기서 e.preventDefault()를 호출하면 cancelable=false 경고만 발생함
      // → 수평/수직 축 추적만 유지 (touchend 스와이프 판별에 사용)
      if (axisLockRef.current === null) {
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) {
          axisLockRef.current = "x";
        } else if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 10) {
          axisLockRef.current = "y";
        }
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      const curIdx = activeIndexRef.current;
      const total = mediaLengthRef.current;
      const start = touchStartRef.current;

      if (!start || e.changedTouches.length !== 1) {
        touchStartRef.current = null;
        axisLockRef.current = null;
        return;
      }

      const dx = e.changedTouches[0].clientX - start.x;
      const dy = e.changedTouches[0].clientY - start.y;
      const dt = Date.now() - start.time;
      const moved = Math.hypot(Math.abs(dx), Math.abs(dy));

      if (total > 1 && axisLockRef.current === "x") {
        // ── 스와이프 → 이미지 네비게이션 (탭으로 이어지지 않음) ──
        const swipePower = dx * Math.abs(dx / Math.max(dt, 1)) * 1000;
        if ((swipePower < -8000 || dx < -60) && curIdx < total - 1) {
          setDirection(1);
          setActiveIndex(curIdx + 1);
        } else if ((swipePower > 8000 || dx > 60) && curIdx > 0) {
          setDirection(-1);
          setActiveIndex(curIdx - 1);
        }
      } else if (moved < 10 && dt < 300) {
        // ── 탭 (이동 < 10px, 시간 < 300ms) → 싱글/더블탭 처리 ──
        // Framer Motion onTap을 대체: 네이티브 레벨에서 스와이프와 완전히 분리
        const now = Date.now();
        if (now - lastTapTimeRef.current < 350 && lastTapTimeRef.current > 0) {
          // 더블탭
          if (tapTimerRef.current) {
            clearTimeout(tapTimerRef.current);
            tapTimerRef.current = null;
          }
          lastTapTimeRef.current = 0;
          onDoubleTapRef.current?.();
        } else {
          // 싱글탭 — 280ms 안에 두 번째 탭이 없으면 확정
          lastTapTimeRef.current = now;
          const clickCb = onImageClickRef.current;
          if (clickCb) {
            if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
            const idxAtTap = curIdx;
            tapTimerRef.current = setTimeout(() => {
              tapTimerRef.current = null;
              clickCb(idxAtTap);
            }, 280);
          }
        }
      }
      // moved >= 10 이지만 axis="x" 미만이거나 단일 이미지 스와이프 → 무시 (모달 열지 않음)

      touchStartRef.current = null;
      axisLockRef.current = null;
    };

    // touchstart도 passive: false — 멀티터치 시작 시 preventDefault()로 pinch 차단
    el.addEventListener("touchstart", onTouchStart, { passive: false });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  // containerRef는 마운트 후 불변 / activeIndex·media.length는 refs로 읽음
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

  if (media.length === 0) return null;

  const isFirst = activeIndex === 0;
  const isLast = activeIndex === media.length - 1;

  return (
    <div>
      {/* ── 이미지 영역 ── */}
      <div
        ref={containerRef}
        className="relative w-full aspect-square bg-gray-100 overflow-hidden"
        style={{ touchAction: "pan-y" }}
      >
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={`${diaryId}-${activeIndex}`}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={slideTransition}
            className={`absolute inset-0 w-full h-full ${onImageClick ? "cursor-pointer" : ""}`}
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
