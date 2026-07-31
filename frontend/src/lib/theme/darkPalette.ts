/**
 * 다크모드 공통 색상 토큰 (near-black 팔레트).
 *
 * 기존 네이비/밤하늘 톤(#0f172a, #1e293b, #020617, slate-*)을 대체한다.
 * 브랜드 오렌지·아이콘 의미색(성공/경고/삭제 등)은 이 팔레트에 포함하지 않는다 —
 * 해당 색상들은 각 화면에서 기존 값을 그대로 유지한다.
 *
 * 라이트 모드에는 적용하지 않는다.
 */
export const darkPalette = {
  /** 앱 최상단 배경 */
  background: "#000000",
  /** 페이지 배경 (background보다 아주 살짝 밝음) */
  pageBackground: "#090909",
  /** 헤더·하단 탭바 배경 */
  navigationBackground: "#0B0B0B",
  /** 카드·드로어·모달 등 표면 */
  surface: "#121212",
  /** 입력창 등 보조 표면 */
  surfaceSecondary: "#1A1A1A",
  /** 테두리·구분선 */
  border: "#262626",
  /** hover/pressed 배경 */
  hover: "#2A2A2A",
  /** 본문 텍스트 */
  textPrimary: "#F5F5F5",
  /** 보조 텍스트 */
  textSecondary: "#A8A8A8",
  /** 비활성 텍스트/아이콘 */
  textMuted: "#737373",
  /** 오버레이(모달 백드롭 등) */
  overlay: "rgba(0, 0, 0, 0.65)",
} as const;

export type DarkPaletteToken = keyof typeof darkPalette;
