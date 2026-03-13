"use client";

import { useEffect, useRef } from "react";
import { getBgmAudio } from "@/lib/bgmAudio";
import { useBgmStore } from "@/stores/bgmStore";

export const SESSION_KEY_AUTOPLAY_ATTEMPTED = "bgm_autoplay_attempted";

/**
 * 전역 오디오 로직 전담 컴포넌트. UI를 렌더링하지 않는다.
 *
 * 역할 1 (자동재생 + unlock):
 *   - 페이지 첫 로드 시 audio.play()를 1회 시도.
 *   - 브라우저 autoplay 정책으로 차단된 경우, document에 pointerdown/touchstart
 *     (capture: true) 리스너를 등록한다.
 *   - capture 리스너는 어떤 inner element가 stopPropagation을 호출해도
 *     항상 수신되며, audio.play()가 성공할 때까지 유지된다.
 *   - audio 'play' DOM 이벤트가 발생하면 unlock 리스너를 자동 해제한다.
 *
 * 역할 2 (beforeunload 플래그 초기화):
 *   - OAuth 로그인 등 전체 페이지 이동 전 bgm_autoplay_attempted를 지운다.
 *   - 복귀 후 새 페이지 로드에서 Effect #1이 초기 로드 타이밍에 audio.play()를
 *     재시도하며, Chrome MEI 정책이 이 타이밍을 허용한다.
 *
 * 역할 3 (DOM 이벤트 → Zustand 동기화):
 *   - play / pause / loadedmetadata / timeupdate / volumechange 이벤트로
 *     스토어의 isPlaying, isAutoplayBlocked, currentTime, duration, isMuted, volume을
 *     실제 audio 상태와 일치시킨다.
 */
export default function BgmPlayer() {
  /**
   * unlock 리스너 함수 참조.
   * null이면 unlock 리스너 비활성 상태, non-null이면 활성 상태.
   */
  const unlockHandlerRef = useRef<(() => void) | null>(null);

  // ── 1. 자동재생 + unlock 리스너 ──────────────────────────────────────────
  useEffect(() => {
    const audio = getBgmAudio();
    if (!audio) return;

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
          // 이미 재생 중이면 unlock만 해제
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

    const alreadyAttempted =
      sessionStorage.getItem(SESSION_KEY_AUTOPLAY_ATTEMPTED) === "true";

    if (!alreadyAttempted) {
      // 초기 로드 타이밍 — Chrome MEI 정책이 허용하는 창
      sessionStorage.setItem(SESSION_KEY_AUTOPLAY_ATTEMPTED, "true");
      audio.play().catch(() => registerUnlock());
    }
    // alreadyAttempted === true: beforeunload가 플래그를 지웠어야 하므로
    // 여기에 도달하는 것은 React StrictMode 이중 마운트 등 예외적 경우.
    // 이 경우 재시도하지 않는다 (오디오가 이미 재생 중일 수 있음).

    return () => {
      audio.removeEventListener("play", onAudioPlay);
      removeUnlock();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── 2. beforeunload: 페이지 이탈 시 플래그 초기화 ──────────────────────────
  //
  // OAuth 로그인 버튼 클릭 → 소셜 로그인 페이지로 전체 페이지 이동.
  // beforeunload 발생 시 bgm_autoplay_attempted를 지운다.
  //
  // 효과: OAuth 복귀 후 새 페이지 로드에서 Effect #1이 alreadyAttempted=false로
  // 판단해 초기 로드 타이밍에 audio.play()를 시도한다.
  // 이는 F5 새로고침 후 자동재생이 되는 원리와 동일하다.
  useEffect(() => {
    const clearFlag = () =>
      sessionStorage.removeItem(SESSION_KEY_AUTOPLAY_ATTEMPTED);
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
