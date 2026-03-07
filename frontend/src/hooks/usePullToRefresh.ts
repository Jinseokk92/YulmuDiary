"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface UsePullToRefreshOptions {
  /** 새로고침을 트리거하는 최소 드래그 거리 (px) */
  threshold?: number;
  /** 최대 당길 수 있는 거리 (px) — 저항감 적용 */
  maxPull?: number;
  onRefresh: () => Promise<void> | void;
  /** true이면 pull 감지 완전 비활성화 (ex. 바텀 시트 열릴 때) */
  disabled?: boolean;
}

interface UsePullToRefreshResult {
  pullY: number;
  isRefreshing: boolean;
  isPulling: boolean;
  /** 0 ~ 1 진행률 (threshold 기준) */
  progress: number;
}

export function usePullToRefresh({
  threshold = 72,
  maxPull = 120,
  onRefresh,
  disabled = false,
}: UsePullToRefreshOptions): UsePullToRefreshResult {
  const [pullY, setPullY] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);

  // 렌더링과 무관한 가변 값은 ref로 관리해 리스너 재등록 없이 접근
  const startYRef = useRef<number | null>(null);
  const pullYRef = useRef(0);
  const isRefreshingRef = useRef(false);
  const onRefreshRef = useRef(onRefresh);
  const disabledRef = useRef(disabled);
  onRefreshRef.current = onRefresh;
  disabledRef.current = disabled;

  useEffect(() => {
    if (!disabled) return;

    startYRef.current = null;
    pullYRef.current = 0;
    setPullY(0);
    setIsPulling(false);
  }, [disabled]);

  const triggerRefresh = useCallback(async () => {
    isRefreshingRef.current = true;
    setIsRefreshing(true);
    pullYRef.current = threshold;
    setPullY(threshold);
    try {
      await onRefreshRef.current();
    } finally {
      setTimeout(() => {
        pullYRef.current = 0;
        setPullY(0);
        setIsRefreshing(false);
        isRefreshingRef.current = false;
      }, 500);
    }
  }, [threshold]);

  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => {
      if (isRefreshingRef.current) return;
      if (disabledRef.current) return;
      if (window.scrollY > 0) return;
      startYRef.current = e.touches[0].clientY;
      setIsPulling(false);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (isRefreshingRef.current) return;
      if (disabledRef.current) {
        startYRef.current = null;
        if (pullYRef.current > 0) {
          pullYRef.current = 0;
          setPullY(0);
          setIsPulling(false);
        }
        return;
      }
      if (startYRef.current === null) return;
      if (window.scrollY > 0) {
        startYRef.current = null;
        return;
      }

      const dy = e.touches[0].clientY - startYRef.current;
      if (dy <= 0) {
        if (pullYRef.current > 0) {
          pullYRef.current = 0;
          setPullY(0);
          setIsPulling(false);
        }
        return;
      }

      // 저항감: 제곱근 기반으로 당길수록 점점 느려짐
      const resistance = Math.sqrt(dy) * (maxPull / Math.sqrt(maxPull * 2));
      const clamped = Math.min(resistance, maxPull);

      pullYRef.current = clamped;
      setPullY(clamped);
      setIsPulling(true);

      e.preventDefault();
    };

    const onTouchEnd = () => {
      if (isRefreshingRef.current) return;
      if (disabledRef.current) {
        startYRef.current = null;
        pullYRef.current = 0;
        setPullY(0);
        setIsPulling(false);
        return;
      }
      if (startYRef.current === null) return;

      startYRef.current = null;
      setIsPulling(false);

      if (pullYRef.current >= threshold) {
        triggerRefresh();
      } else {
        pullYRef.current = 0;
        setPullY(0);
      }
    };

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
    };
    // triggerRefresh만 의존성 — onRefresh는 ref로 처리해 재등록 방지
  }, [threshold, maxPull, triggerRefresh]);

  return {
    pullY,
    isRefreshing,
    isPulling,
    progress: Math.min(pullY / threshold, 1),
  };
}
