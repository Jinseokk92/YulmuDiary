"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight, Images } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { MediaDto } from "@/types";
import { getMediaUrl } from "@/lib/utils";

interface ImageViewerProps {
  media: MediaDto[];
  initialIndex: number;
  onClose: () => void;
  /**
   * 더블탭 시 호출되는 콜백. 좋아요 토글 등 외부 동작을 담당한다.
   * ImageViewer는 콜백 여부와 무관하게 항상 하트 애니메이션을 표시한다.
   */
  onDoubleTap?: () => void;
}

export default function ImageViewer({
  media,
  initialIndex,
  onClose,
  onDoubleTap,
}: ImageViewerProps) {
  const [mounted, setMounted] = useState(false);
  const [index, setIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [imgErrors, setImgErrors] = useState<Record<number, boolean>>({});

  // ── 하트 애니메이션 ──────────────────────────────────────────────────────
  const [heartVisible, setHeartVisible] = useState(false);
  const [heartKey, setHeartKey] = useState(0);
  const heartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── 제스처 추적 refs ──────────────────────────────────────────────────────
  const scaleRef = useRef(1);
  const panRef = useRef({ x: 0, y: 0 });
  const pinchStartDist = useRef<number | null>(null);
  const pinchStartScale = useRef(1);
  const pointerStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const lastTapRef = useRef(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  // 제스처 모드: 단일 터치 진행 중엔 pinch 전환 차단, pinch 중엔 single 전환 차단
  const gestureModeRef = useRef<"single" | "pinch" | null>(null);

  // ── 마운트 / 바디 스크롤 잠금 ──────────────────────────────────────────
  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
      if (heartTimerRef.current) clearTimeout(heartTimerRef.current);
    };
  }, []);

  // ── 이미지 이동 ────────────────────────────────────────────────────────
  const goTo = useCallback(
    (i: number) => {
      if (i < 0 || i >= media.length) return;
      setIndex(i);
      scaleRef.current = 1;
      setScale(1);
      panRef.current = { x: 0, y: 0 };
      setPan({ x: 0, y: 0 });
    },
    [media.length]
  );

  // ── 키보드 ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && scaleRef.current <= 1) goTo(index - 1);
      if (e.key === "ArrowRight" && scaleRef.current <= 1) goTo(index + 1);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [index, onClose, goTo]);

  // ── 더블탭 하트 ───────────────────────────────────────────────────────
  const triggerHeart = useCallback(() => {
    if (heartTimerRef.current) clearTimeout(heartTimerRef.current);
    setHeartKey((k) => k + 1);
    setHeartVisible(true);
    heartTimerRef.current = setTimeout(() => setHeartVisible(false), 800);
    onDoubleTap?.();
  }, [onDoubleTap]);

  // ── 터치 제스처 (핀치 줌 / 패닝 / 스와이프) ──────────────────────────────
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    // 핀치로 인식하기 위한 두 손가락 최소 거리 (이보다 가까우면 실수 터치로 간주)
    const PINCH_MIN_START_DIST = 40;

    const onTouchStart = (e: TouchEvent) => {
      // 이벤트가 document까지 전파되지 않도록 차단 (pull-to-refresh 등 방지)
      e.stopPropagation();
      if (e.touches.length === 2) {
        const dx = e.touches[1].clientX - e.touches[0].clientX;
        const dy = e.touches[1].clientY - e.touches[0].clientY;
        const dist = Math.hypot(dx, dy);
        // 핀치 시작: 단일 터치 제스처 진행 중이거나 손가락이 너무 가까우면 무시
        if (gestureModeRef.current !== "single" && dist >= PINCH_MIN_START_DIST) {
          pinchStartDist.current = dist;
          pinchStartScale.current = scaleRef.current;
          gestureModeRef.current = "pinch";
        }
        pointerStartRef.current = null;
      } else if (e.touches.length === 1) {
        // 단일 터치 시작: pinch 제스처가 이미 진행 중이면 무시
        if (gestureModeRef.current !== "pinch") {
          pinchStartDist.current = null;
          gestureModeRef.current = "single";
          pointerStartRef.current = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY,
            time: Date.now(),
          };
        }
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      // 전파 차단 + 브라우저 기본 동작(스크롤, pull-to-refresh) 완전 차단
      e.stopPropagation();
      e.preventDefault();

      if (e.touches.length === 2 && gestureModeRef.current === "pinch" && pinchStartDist.current !== null) {
        // 핀치 줌 (pinch 모드에서만)
        const dx = e.touches[1].clientX - e.touches[0].clientX;
        const dy = e.touches[1].clientY - e.touches[0].clientY;
        const dist = Math.hypot(dx, dy);
        const newScale = Math.max(
          1,
          Math.min(5, pinchStartScale.current * (dist / pinchStartDist.current))
        );
        scaleRef.current = newScale;
        setScale(newScale);
      } else if (e.touches.length === 1 && gestureModeRef.current === "single" && scaleRef.current > 1.05) {
        // 확대 상태에서 패닝 (single 모드 + 확대 상태에서만)
        if (!pointerStartRef.current) return;
        const dx = e.touches[0].clientX - pointerStartRef.current.x;
        const dy = e.touches[0].clientY - pointerStartRef.current.y;
        const newPan = { x: panRef.current.x + dx, y: panRef.current.y + dy };
        panRef.current = newPan;
        setPan(newPan);
        pointerStartRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
          time: pointerStartRef.current.time,
        };
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      // 전파 차단 (pull-to-refresh 등이 touchend를 받지 않도록)
      e.stopPropagation();
      const remainingTouches = e.touches.length;

      if (remainingTouches === 0) {
        pinchStartDist.current = null;
      } else if (remainingTouches === 1 && gestureModeRef.current === "pinch") {
        // pinch → single 전환: 남은 손가락으로 패닝 허용
        gestureModeRef.current = "single";
        pointerStartRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
          time: Date.now(),
        };
        pinchStartDist.current = null;
        return; // 탭/스와이프로 처리하지 않음
      }

      const start = pointerStartRef.current;
      if (!start || e.changedTouches.length !== 1 || gestureModeRef.current === "pinch") {
        pointerStartRef.current = null;
        if (remainingTouches === 0) gestureModeRef.current = null;
        return;
      }

      const changed = e.changedTouches[0];
      const dx = changed.clientX - start.x;
      const dy = changed.clientY - start.y;
      const dt = Date.now() - start.time;
      const moved = Math.hypot(dx, dy);

      if (moved < 15 && dt < 300) {
        // 탭 — 더블탭 감지
        const now = Date.now();
        if (now - lastTapRef.current < 350 && lastTapRef.current > 0) {
          triggerHeart();
          lastTapRef.current = 0;
        } else {
          lastTapRef.current = now;
        }
      } else if (scaleRef.current <= 1.05) {
        // 스와이프 제스처 (축소 상태에서만)
        if (dy > 80 && Math.abs(dx) < Math.abs(dy)) {
          // 아래로 스와이프 → 닫기
          onClose();
        } else if (Math.abs(dx) > 50 && Math.abs(dy) < 60) {
          // 좌우 스와이프 → 이미지 이동
          if (dx < 0) goTo(index + 1);
          else goTo(index - 1);
        }
      }

      // scale이 1에 가깝거나(≤1.1) 미만이면 정확히 1로 스냅백 + pan 초기화
      // 의도치 않은 미세 확대 상태에서 pan이 활성화되는 것을 방지
      if (scaleRef.current <= 1.1) {
        scaleRef.current = 1;
        setScale(1);
        panRef.current = { x: 0, y: 0 };
        setPan({ x: 0, y: 0 });
      }

      pointerStartRef.current = null;
      if (remainingTouches === 0) gestureModeRef.current = null;
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [index, onClose, goTo, triggerHeart]);

  if (!mounted) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="이미지 뷰어"
      className="fixed inset-0 z-[9999] bg-black flex items-center justify-center select-none"
      style={{ touchAction: "none" }}
    >
      {/* ── 닫기 버튼 ── */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-20 w-10 h-10 flex items-center justify-center
                   text-white bg-black/50 rounded-full backdrop-blur-sm
                   hover:bg-black/70 transition-colors"
        aria-label="닫기"
      >
        <X className="w-5 h-5" />
      </button>

      {/* ── 이미지 카운터 ── */}
      {media.length > 1 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <span className="bg-black/50 text-white text-sm px-3 py-1 rounded-full backdrop-blur-sm">
            {index + 1} / {media.length}
          </span>
        </div>
      )}

      {/* ── 이미지 영역 (터치 제스처 수신) ── */}
      <div
        ref={wrapRef}
        className="w-full h-full flex items-center justify-center overflow-hidden"
        style={{ touchAction: "none" }}
      >
        {/* 변환 레이어 (핀치 줌 + 패닝) */}
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            transformOrigin: "center center",
            willChange: "transform",
            width: "100%",
            height: "100%",
            position: "relative",
          }}
        >
          {imgErrors[index] ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Images className="w-16 h-16 text-gray-600" />
            </div>
          ) : (
            <Image
              src={getMediaUrl(media[index].url)}
              alt={`이미지 ${index + 1}`}
              fill
              className="object-contain pointer-events-none"
              sizes="100vw"
              priority
              draggable={false}
              onError={() =>
                setImgErrors((prev) => ({ ...prev, [index]: true }))
              }
            />
          )}
        </div>

        {/* ── 더블탭 하트 오버레이 ── */}
        <AnimatePresence>
          {heartVisible && (
            <motion.div
              key={heartKey}
              className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
              initial={{ opacity: 0, scale: 0.3 }}
              animate={{ opacity: [0, 1, 1, 0], scale: [0.3, 1.4, 1, 1] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.75, times: [0, 0.18, 0.45, 1] }}
              aria-hidden="true"
            >
              <svg
                viewBox="0 0 24 24"
                fill="#ef4444"
                className="w-24 h-24 drop-shadow-2xl"
              >
                <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
              </svg>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── 이전/다음 버튼 (데스크톱 전용) ── */}
      {index > 0 && (
        <button
          onClick={() => goTo(index - 1)}
          className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10
                     hidden sm:flex items-center justify-center text-white bg-black/50 rounded-full
                     hover:bg-black/70 transition-colors"
          aria-label="이전 이미지"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}
      {index < media.length - 1 && (
        <button
          onClick={() => goTo(index + 1)}
          className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10
                     hidden sm:flex items-center justify-center text-white bg-black/50 rounded-full
                     hover:bg-black/70 transition-colors"
          aria-label="다음 이미지"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}

      {/* ── 도트 인디케이터 ── */}
      {media.length > 1 && (
        <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-2 z-20">
          {media.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`h-1.5 rounded-full transition-all duration-200 ${
                i === index ? "bg-white w-4" : "bg-white/40 w-1.5"
              }`}
              aria-label={`이미지 ${i + 1}로 이동`}
            />
          ))}
        </div>
      )}
    </div>,
    document.body
  );
}
