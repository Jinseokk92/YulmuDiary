"use client";

import { useEffect, useRef } from "react";
import { getBgmAudio } from "@/lib/bgmAudio";
import { useBgmStore } from "@/stores/bgmStore";
import { useAuthStore } from "@/stores/authStore";

/** sessionStorage 키: 로그인 후 최초 자동재생 완료 여부 */
const SESSION_KEY_BGM_AUTO_PLAYED = "bgmAutoPlayed";

/**
 * 전역 오디오 로직 전담 컴포넌트. UI를 렌더링하지 않는다.
 *
 * 역할 1 (자동재생 + unlock):
 *   - 로그인 상태일 때만 작동한다. 미인증 시 재생을 중단한다.
 *   - 로그인 후 최초 1회만 audio.play()를 시도한다 (SESSION_KEY_BGM_AUTO_PLAYED 키로 관리).
 *   - 브라우저 autoplay 정책으로 차단된 경우, document에 pointerdown/touchstart
 *     (capture: true) 리스너를 등록해 첫 제스처에서 재생을 시도한다.
 *   - audio 'play' DOM 이벤트가 발생하면 unlock 리스너를 자동 해제한다.
 *
 * 역할 2 (beforeunload 플래그 초기화):
 *   - OAuth 로그인 등 전체 페이지 이동 전 SESSION_KEY_BGM_AUTO_PLAYED를 지운다.
 *   - 복귀 후 새 페이지 로드에서 Effect #1이 자동재생을 재시도한다.
 *
 * 역할 3 (DOM 이벤트 → Zustand 동기화):
 *   - play / pause / loadedmetadata / timeupdate / volumechange 이벤트로
 *     스토어의 isPlaying, isAutoplayBlocked, currentTime, duration, isMuted, volume을
 *     실제 audio 상태와 일치시킨다.
 */
export default function BgmPlayer() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  /**
   * unlock 리스너 함수 참조.
   * null이면 unlock 리스너 비활성 상태, non-null이면 활성 상태.
   */
  const unlockHandlerRef = useRef<(() => void) | null>(null);

  // ── 1. 자동재생 + unlock 리스너 ──────────────────────────────────────────
  useEffect(() => {
    const audio = getBgmAudio();
    if (!audio) return;

    // 비인증 상태: 재생 금지 + 기존 unlock 리스너 정리
    if (!isAuthenticated) {
      if (!audio.paused) audio.pause();
      const handler = unlockHandlerRef.current;
      if (handler) {
        unlockHandlerRef.current = null;
        useBgmStore.setState({ isAutoplayBlocked: false });
        document.removeEventListener("pointerdown", handler, true);
        document.removeEventListener("touchstart", handler, true);
      }
      return;
    }

    // ── 인증 상태 ──────────────────────────────────────────────────────────

    const removeUnlock = () => {
      const handler = unlockHandlerRef.current;
      if (!handler) return;
      unlockHandlerRef.current = null;
      useBgmStore.setState({ isAutoplayBlocked: false });
      document.removeEventListener("pointerdown", handler, true);
      document.removeEventListener("touchstart", handler, true);
    };

    const registerUnlock = () => {
      if (unlockHandlerRef.current) return; // 이미 등록됨

      const handler = () => {
        if (!audio.paused) {
          removeUnlock();
          return;
        }
        // 사용자 제스처 핸들러 안에서 직접 audio.play() 호출
        // — 이 컨텍스트에서 브라우저는 user activation으로 인정한다.
        audio.play().catch(() => {
          // 여전히 차단됨(예: iOS 저전력 모드) — 리스너 유지, 다음 제스처에서 재시도
        });
      };

      unlockHandlerRef.current = handler;
      useBgmStore.setState({ isAutoplayBlocked: true });
      // capture: true → stopPropagation과 무관하게 모든 pointerdown/touchstart 수신
      document.addEventListener("pointerdown", handler, true);
      document.addEventListener("touchstart", handler, { capture: true, passive: true });
    };

    // audio 'play' DOM 이벤트 발생 시 unlock 리스너 자동 해제
    const onAudioPlay = () => removeUnlock();
    audio.addEventListener("play", onAudioPlay);

    // 이미 자동재생이 완료됐으면 이후 페이지 이동에서 재생 시도하지 않음
    const alreadyAutoPlayed =
      sessionStorage.getItem(SESSION_KEY_BGM_AUTO_PLAYED) === "true";

    if (!alreadyAutoPlayed) {
      // 로그인 후 최초 1회 자동재생 시도
      sessionStorage.setItem(SESSION_KEY_BGM_AUTO_PLAYED, "true");
      audio.play().catch(() => registerUnlock());
    }

    return () => {
      audio.removeEventListener("play", onAudioPlay);
      removeUnlock();
    };
  }, [isAuthenticated]);

  // ── 2. beforeunload: 페이지 이탈 시 플래그 초기화 ──────────────────────────
  //
  // OAuth 로그인 버튼 클릭 → 소셜 로그인 페이지로 전체 페이지 이동.
  // beforeunload 발생 시 SESSION_KEY_BGM_AUTO_PLAYED를 지운다.
  //
  // 효과: OAuth 복귀 후 새 페이지 로드에서 Effect #1이 alreadyAutoPlayed=false로
  // 판단해 초기 로드 타이밍에 audio.play()를 재시도한다.
  useEffect(() => {
    const clearFlag = () =>
      sessionStorage.removeItem(SESSION_KEY_BGM_AUTO_PLAYED);
    window.addEventListener("beforeunload", clearFlag);
    return () => window.removeEventListener("beforeunload", clearFlag);
  }, []);

  // ── 3. DOM 이벤트 → Zustand 상태 동기화 ──────────────────────────────────
  //
  // play / pause 이벤트로 isPlaying을 실제 audio 상태와 일치시킨다.
  // 브라우저가 백그라운드 탭에서 오디오를 일시정지하거나 iOS 인터럽션이 발생해도
  // UI 상태가 audio.paused와 어긋나지 않는다.
  useEffect(() => {
    const audio = getBgmAudio();
    if (!audio) return;

    const onPlay     = () => useBgmStore.setState({ isPlaying: true });
    const onPause    = () => useBgmStore.setState({ isPlaying: false });
    const onMeta     = () => useBgmStore.setState({ duration: audio.duration });
    const onTime     = () => useBgmStore.setState({ currentTime: audio.currentTime });
    const onVolume   = () =>
      useBgmStore.setState({ isMuted: audio.muted, volume: audio.volume });

    audio.addEventListener("play",          onPlay);
    audio.addEventListener("pause",         onPause);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("timeupdate",    onTime);
    audio.addEventListener("volumechange",  onVolume);

    // 초기 상태 동기화 (이미 재생 중인 경우 포함)
    useBgmStore.setState({
      isPlaying: !audio.paused,
      isMuted:   audio.muted,
      volume:    audio.volume,
    });
    if (audio.readyState >= 1) {
      useBgmStore.setState({ duration: audio.duration });
    }

    return () => {
      audio.removeEventListener("play",          onPlay);
      audio.removeEventListener("pause",         onPause);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("timeupdate",    onTime);
      audio.removeEventListener("volumechange",  onVolume);
    };
  }, []);

  return null;
}
