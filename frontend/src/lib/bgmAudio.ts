// ─────────────────────────────────────────────────────────────────────────────
// 🎵 BGM 교체 시 이 블록만 수정하면 됩니다
// ─────────────────────────────────────────────────────────────────────────────
export const BGM_TRACK = {
  /** 음원 파일 경로 — public/ 폴더 기준 */
  src: "/bgms/little-village-morning.mp3",
  /** 기본 볼륨 (0.0 ~ 1.0) */
  volume: 0.4,
  /** 플레이어에 표시할 곡명 */
  title: "Little Village Morning",
  /** 플레이어에 표시할 부제목 */
  subtitle: "배경음악",
  /**
   * 앨범아트 이미지 경로. null이면 오렌지 그라디언트 + 음표 아이콘을 사용한다.
   * 예: "/bgms/album-art.jpg"
   */
  artSrc: null as string | null,
};
// ─────────────────────────────────────────────────────────────────────────────

let _instance: HTMLAudioElement | null = null;

/**
 * 앱 전체에서 하나의 Audio 인스턴스를 공유하는 싱글톤 접근자.
 * 서버(SSR)에서는 window가 없으므로 null을 반환한다.
 * 처음 호출 시 Audio 엘리먼트를 생성하고 BGM 파일 로딩이 시작된다.
 * 인증 전에는 호출을 피하려면 getExistingBgmAudio()를 사용할 것.
 */
export function getBgmAudio(): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  if (!_instance) {
    _instance = new Audio(BGM_TRACK.src);
    _instance.loop = true;
    _instance.volume = BGM_TRACK.volume;
  }
  return _instance;
}

/**
 * Audio 인스턴스가 이미 생성되어 있으면 반환하고, 없으면 null을 반환한다.
 * 인스턴스를 새로 생성하지 않으므로 비인증 상태에서 안전하게 호출할 수 있다.
 */
export function getExistingBgmAudio(): HTMLAudioElement | null {
  return _instance;
}

/**
 * 초(seconds)를 "M:SS" 포맷 문자열로 변환한다.
 * - 0       → "0:00"
 * - 97      → "1:37"
 * - NaN/Inf → "0:00"
 */
export function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const total = Math.floor(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
