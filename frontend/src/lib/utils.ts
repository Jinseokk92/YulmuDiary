const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * "YYYY-MM-DD" 문자열을 로컬 자정(00:00:00)으로 파싱.
 * new Date("YYYY-MM-DD")는 UTC 기준으로 파싱되어 타임존에 따라 하루 차이가 생기므로
 * new Date(y, m-1, d) 방식으로 로컬 시간 기준으로 생성한다.
 */
function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d); // 로컬 자정 (Off-by-one 방지)
}

/**
 * Date 객체를 로컬 자정(00:00:00.000)으로 정규화
 */
function toLocalMidnight(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * 목표 날짜와 오늘의 일수 차이를 "D-10", "D-Day", "D+5" 형식으로 반환.
 * @param targetDateStr "YYYY-MM-DD" 형식의 기준 날짜
 */
export function calcDday(targetDateStr: string): string {
  const today  = toLocalMidnight(new Date());
  const target = parseLocalDate(targetDateStr); // 로컬 자정 기준

  // today - target: 양수=목표가 과거(D+N), 음수=목표가 미래(D-N)
  const diffDays = Math.round((today.getTime() - target.getTime()) / MS_PER_DAY);

  if (diffDays === 0) return "D-Day";
  if (diffDays > 0) return `D+${diffDays}`;
  return `D${diffDays}`; // diffDays가 음수이므로 "D-N" 형태로 자동 생성
}

/**
 * 마지막 생리일(LMP)로부터 현재 임신 주수와 나머지 일수를 계산.
 * @param lmpDateStr "YYYY-MM-DD" 형식의 마지막 생리일
 * @returns { weeks: number, days: number }
 *
 * 예) LMP = "2025-09-20", 오늘 = "2026-03-04"
 *   → 경과 165일 → { weeks: 23, days: 4 } → "임신 23주 4일차"
 */
export function calcPregnancyWeek(lmpDateStr: string): { weeks: number; days: number } {
  const today      = toLocalMidnight(new Date());
  const lmp        = parseLocalDate(lmpDateStr);
  const totalDays  = Math.round((today.getTime() - lmp.getTime()) / MS_PER_DAY);

  if (totalDays <= 0) return { weeks: 0, days: 0 };
  return { weeks: Math.floor(totalDays / 7), days: totalDays % 7 };
}

/**
 * 출산 예정일로부터 마지막 생리일(LMP)을 역산.
 * 표준 임신 기간: 40주 = 280일
 * @param dueDateStr "YYYY-MM-DD" 형식의 출산 예정일
 * @returns "YYYY-MM-DD" 형식의 LMP
 *
 * 예) "2026-06-27" → "2025-09-20"
 */
export function calcLmpFromDueDate(dueDateStr: string): string {
  const due = parseLocalDate(dueDateStr);
  const lmp = new Date(due.getTime() - 280 * MS_PER_DAY);
  const y = lmp.getFullYear();
  const m = String(lmp.getMonth() + 1).padStart(2, "0");
  const d = String(lmp.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * 생년월일로부터 오늘까지 경과한 일수를 "N주 N일" 형식으로 반환.
 * (출생 후 성장 추적용)
 */
export function calcAgeDisplay(birthDateStr: string): string {
  const today     = toLocalMidnight(new Date());
  const birth     = parseLocalDate(birthDateStr);
  const totalDays = Math.round((today.getTime() - birth.getTime()) / MS_PER_DAY);

  if (totalDays < 0) return "출생 예정";
  if (totalDays === 0) return "태어난 날";

  const weeks = Math.floor(totalDays / 7);
  const days  = totalDays % 7;

  if (weeks === 0) return `${days}일`;
  if (days === 0) return `${weeks}주`;
  return `${weeks}주 ${days}일`;
}

const MINUTE = 60 * 1000;
const HOUR   = 60 * MINUTE;
const DAY    = 24 * HOUR;
const WEEK   = 7 * DAY;
const MONTH  = 30 * DAY;
const YEAR   = 365 * DAY;

/**
 * ISO 날짜 문자열을 "방금 전", "3분 전", "2시간 전" 등 상대 시간으로 변환
 */
export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now  = Date.now();
  const diff = now - date.getTime();

  if (diff < MINUTE) return "방금 전";
  if (diff < HOUR)   return `${Math.floor(diff / MINUTE)}분 전`;
  if (diff < DAY)    return `${Math.floor(diff / HOUR)}시간 전`;
  if (diff < WEEK)   return `${Math.floor(diff / DAY)}일 전`;
  if (diff < MONTH)  return `${Math.floor(diff / WEEK)}주 전`;
  if (diff < YEAR)   return `${Math.floor(diff / MONTH)}개월 전`;
  return `${Math.floor(diff / YEAR)}년 전`;
}

/**
 * 미디어 URL이 상대 경로면 API 서버 URL을 붙여 절대 경로로 변환
 */
export function getMediaUrl(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  return `${base}${url.startsWith("/") ? "" : "/"}${url}`;
}
