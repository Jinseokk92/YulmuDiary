const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * 두 날짜를 자정(00:00:00) 기준으로 정규화하여 시간 오차 제거
 */
function toMidnight(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * 목표 날짜와 오늘의 일수 차이를 "D-10", "D-Day", "D+50" 형식으로 반환
 * @param targetDateStr "YYYY-MM-DD" 형식의 기준 날짜
 */
export function calcDday(targetDateStr: string): string {
  const today = toMidnight(new Date());
  const target = toMidnight(new Date(targetDateStr));
  const diffDays = Math.round(
    (today.getTime() - target.getTime()) / MS_PER_DAY
  );

  if (diffDays === 0) return "D-Day";
  if (diffDays > 0) return `D+${diffDays}`;
  return `D${diffDays}`; // diffDays가 음수이므로 "D-N" 형태로 자동 생성
}

/**
 * 생년월일로부터 오늘까지 경과한 일수를 "N주 N일" 형식으로 반환
 * @param birthDateStr "YYYY-MM-DD" 형식의 생년월일
 */
export function calcAgeDisplay(birthDateStr: string): string {
  const today = toMidnight(new Date());
  const birth = toMidnight(new Date(birthDateStr));
  const totalDays = Math.round(
    (today.getTime() - birth.getTime()) / MS_PER_DAY
  );

  if (totalDays < 0) return "출생 예정";
  if (totalDays === 0) return "태어난 날";

  const weeks = Math.floor(totalDays / 7);
  const days = totalDays % 7;

  if (weeks === 0) return `${days}일`;
  if (days === 0) return `${weeks}주`;
  return `${weeks}주 ${days}일`;
}

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;

/**
 * ISO 날짜 문자열을 "방금 전", "3분 전", "2시간 전" 등 상대 시간으로 변환
 */
export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = Date.now();
  const diff = now - date.getTime();

  if (diff < MINUTE) return "방금 전";
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)}분 전`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)}시간 전`;
  if (diff < WEEK) return `${Math.floor(diff / DAY)}일 전`;
  if (diff < MONTH) return `${Math.floor(diff / WEEK)}주 전`;
  if (diff < YEAR) return `${Math.floor(diff / MONTH)}개월 전`;
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
