"use client";

import { useEffect } from "react";
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

  // ── 1. 비인증 시 오디오 정지 ─────────────────────────────────────────────
  // getExistingBgmAudio()를 사용해 싱글톤이 없으면 생성하지 않는다.
  useEffect(() => {
    if (isAuthenticated) return;
    const audio = getExistingBgmAudio();
    if (audio && !audio.paused) audio.pause();
  }, [isAuthenticated]);

  // ── 2. DOM 이벤트 → Zustand 상태 동기화 ──────────────────────────────────
  //
  // 인증 상태에서만 오디오 싱글톤을 생성하고 이벤트 리스너를 등록한다.
  // play / pause 이벤트로 isPlaying을 실제 audio 상태와 일치시킨다.
  // 브라우저가 백그라운드 탭에서 오디오를 일시정지하거나 iOS 인터럽션이 발생해도
  // UI 상태가 audio.paused와 어긋나지 않는다.
  useEffect(() => {
    if (!isAuthenticated) return; // 비인증 시 싱글톤 생성 방지
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
  }, [isAuthenticated]);

  return null;
}
