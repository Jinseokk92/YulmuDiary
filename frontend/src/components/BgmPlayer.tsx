"use client";

import { useEffect, useRef } from "react";
import { getBgmAudio } from "@/lib/bgmAudio";
import { useBgmStore } from "@/stores/bgmStore";

export const SESSION_KEY_AUTOPLAY_ATTEMPTED = "bgm_autoplay_attempted";

/**
 * 전역 오디오 로직 전담 컴포넌트. UI를 렌더링하지 않는다.
 *
 * 역할 1 (자동재생): 브라우저 최초 로드 시 1회 재생 시도.
 *   - sessionStorage 플래그로 SPA 재방문/StrictMode 이중 실행을 차단한다.
 *   - autoplay 정책으로 막히면 첫 유저 인터랙션(click/touchstart/keydown)에서 fallback 재생한다.
 *
 * 역할 2 (상태 동기화): 오디오 DOM 이벤트를 Zustand 스토어에 반영한다.
 *   - loadedmetadata → duration
 *   - timeupdate     → currentTime
 *   - volumechange   → isMuted, volume
 */
export default function BgmPlayer() {
  const setIsPlaying = useBgmStore((s) => s.setIsPlaying);
  const fallbackHandlerRef = useRef<(() => void) | null>(null);

  // ── 1. 자동재생 로직 ────────────────────────────────────────────────────────
  useEffect(() => {
    const audio = getBgmAudio();
    if (!audio) return;

    const attemptPlay = () =>
      audio.play().then(() => setIsPlaying(true));

    const removeFallback = () => {
      if (!fallbackHandlerRef.current) return;
      document.removeEventListener("click", fallbackHandlerRef.current);
      document.removeEventListener("touchstart", fallbackHandlerRef.current);
      document.removeEventListener("keydown", fallbackHandlerRef.current);
      fallbackHandlerRef.current = null;
    };

    const registerFallback = () => {
      if (fallbackHandlerRef.current) return;
      const handler = () => {
        attemptPlay().catch(() => {});
        removeFallback();
      };
      fallbackHandlerRef.current = handler;
      document.addEventListener("click", handler);
      document.addEventListener("touchstart", handler);
      document.addEventListener("keydown", handler);
    };

    const alreadyAttempted =
      sessionStorage.getItem(SESSION_KEY_AUTOPLAY_ATTEMPTED) === "true";

    if (alreadyAttempted) return;

    sessionStorage.setItem(SESSION_KEY_AUTOPLAY_ATTEMPTED, "true");

    attemptPlay().catch(() => {
      registerFallback();
    });

    return () => {
      removeFallback();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── 2. 오디오 이벤트 → Zustand 상태 동기화 ──────────────────────────────────
  //
  // useBgmStore.setState()를 직접 사용한다.
  // 컴포넌트 외부에서도 Zustand 스토어를 직접 변경하는 공식적인 패턴이다.
  useEffect(() => {
    const audio = getBgmAudio();
    if (!audio) return;

    const onLoadedMetadata = () => {
      useBgmStore.setState({ duration: audio.duration });
    };

    const onTimeUpdate = () => {
      useBgmStore.setState({ currentTime: audio.currentTime });
    };

    const onVolumeChange = () => {
      useBgmStore.setState({ isMuted: audio.muted, volume: audio.volume });
    };

    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("volumechange", onVolumeChange);

    // 이미 메타데이터가 로드된 경우 초기값을 즉시 주입
    // (audio.readyState >= 1: HAVE_METADATA 이상)
    if (audio.readyState >= 1) {
      useBgmStore.setState({ duration: audio.duration });
    }
    // 볼륨/뮤트 초기 상태 동기화
    useBgmStore.setState({ isMuted: audio.muted, volume: audio.volume });

    return () => {
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("volumechange", onVolumeChange);
    };
  }, []);

  return null;
}
