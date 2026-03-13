import { create } from "zustand";
import { getBgmAudio, BGM_TRACK } from "@/lib/bgmAudio";

// ─── 타입 ────────────────────────────────────────────────────────────────────

export interface BgmState {
  // ── 재생 ──────────────────────────────────────────────────────────────────
  isPlaying: boolean;
  /**
   * true: autoplay가 브라우저 정책에 의해 차단되어 첫 사용자 제스처 대기 중.
   * BgmPlayer의 unlock 리스너가 등록된 상태를 나타낸다.
   * audio.play()가 성공하면 자동으로 false로 전환된다.
   */
  isAutoplayBlocked: boolean;

  // ── 음소거 / 볼륨 ─────────────────────────────────────────────────────────
  isMuted: boolean;
  /** 실제 볼륨 (0.0 ~ 1.0). 음소거 여부와 독립적으로 유지된다. */
  volume: number;

  // ── 재생 시간 (초 단위) ────────────────────────────────────────────────────
  /** 현재 재생 위치. timeupdate 이벤트로 갱신된다. */
  currentTime: number;
  /** 전체 재생 시간. loadedmetadata 이벤트로 갱신된다. */
  duration: number;

  // ── 액션 ──────────────────────────────────────────────────────────────────
  play: () => Promise<void>;
  pause: () => void;
  toggle: () => void;
  /** BgmPlayer의 자동재생 로직에서 직접 상태를 주입할 때만 사용 */
  setIsPlaying: (v: boolean) => void;

  /** 음소거 토글. volumechange 이벤트를 통해 isMuted가 자동 동기화된다. */
  toggleMute: () => void;
  /**
   * 볼륨을 설정한다 (0.0 ~ 1.0).
   * - v > 0이고 현재 음소거 중이면 자동 해제한다.
   * - volumechange 이벤트를 통해 volume/isMuted가 자동 동기화된다.
   */
  setVolume: (v: number) => void;
}

// ─── 스토어 ──────────────────────────────────────────────────────────────────

export const useBgmStore = create<BgmState>((set, get) => ({
  isPlaying: false,
  isAutoplayBlocked: false,
  isMuted: false,
  volume: BGM_TRACK.volume,
  currentTime: 0,
  duration: 0,

  setIsPlaying: (v) => set({ isPlaying: v }),

  play: async () => {
    const audio = getBgmAudio();
    if (!audio) return;
    await audio.play();
    set({ isPlaying: true });
  },

  pause: () => {
    const audio = getBgmAudio();
    if (!audio) return;
    audio.pause();
    set({ isPlaying: false });
  },

  toggle: () => {
    const { isPlaying, play, pause } = get();
    if (isPlaying) {
      pause();
    } else {
      play().catch(() => set({ isPlaying: false }));
    }
  },

  toggleMute: () => {
    const audio = getBgmAudio();
    if (!audio) return;
    audio.muted = !audio.muted;
    // volumechange 이벤트 → BgmPlayer → useBgmStore.setState 로 isMuted 동기화
  },

  setVolume: (v: number) => {
    const audio = getBgmAudio();
    if (!audio) return;
    const clamped = Math.max(0, Math.min(1, v));
    audio.volume = clamped;
    if (clamped > 0 && audio.muted) {
      audio.muted = false; // 슬라이더로 볼륨 올리면 음소거 자동 해제
    }
    // volumechange 이벤트 → BgmPlayer → useBgmStore.setState 로 동기화
  },
}));
