"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { getBgmAudio, getExistingBgmAudio } from "@/lib/bgmAudio";
import { useBgmStore } from "@/stores/bgmStore";
import { useAuthStore } from "@/stores/authStore";

/**
 * 전역 오디오 로직 전담 컴포넌트. UI를 렌더링하지 않는다.
 *
 * 역할 1 (비인증 시 정지):
 *   - 비인증 상태가 되면 재생 중인 오디오를 정지한다.
 *
 * 역할 2 (DOM 이벤트 → Zustand 동기화):
 *   - play / pause / loadedmetadata / timeupdate / volumechange 이벤트로
 *     스토어의 isPlaying, currentTime, duration, isMuted, volume을
 *     실제 audio 상태와 일치시킨다.
 *
 * 재생은 유저가 음표 토큰을 직접 터치해야만 시작된다 (bgmStore.toggle → audio.play()).
 */
export default function BgmPlayer() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const pathname = usePathname();

  // ── 1. 비인증 시 오디오 정지 ─────────────────────────────────────────────
  // getExistingBgmAudio()를 사용해 싱글톤이 없으면 생성하지 않는다.
  useEffect(() => {
    if (isAuthenticated) return;
    const audio = getExistingBgmAudio();
    if (audio && !audio.paused) audio.pause();
  }, [isAuthenticated]);

  // ── 2. DOM 이벤트 → Zustand 상태 동기화 ──────────────────────────────────
  //
  // 인증 상태이고 OAuth 리다이렉트 페이지(/auth/*)가 아닐 때만 싱글톤을 생성한다.
  // OAuth 흐름 중(callback → success) 오디오를 생성하면 iOS WebKit이 해당 엘리먼트를
  // "유저 제스처 없이 생성된 것"으로 취급해 이후 play()를 거부할 수 있다.
  // 유저가 /에 도달한 뒤 생성함으로써 두 경우(일반 시작 / OAuth 복귀)를 동일하게 만든다.
  useEffect(() => {
    if (!isAuthenticated) return;
    if (pathname?.startsWith("/auth/")) return; // OAuth 리다이렉트 중 생성 차단
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
  }, [isAuthenticated, pathname]);

  return null;
}
