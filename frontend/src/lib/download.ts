/**
 * 이미지 다운로드 유틸
 *
 * Web Share API (navigator.canShare) 지원 기기: 공유 시트 → 갤러리/파일 저장 (iOS, Android PWA)
 * 미지원 기기 (데스크톱 등): blob → <a download>
 *
 * GCS CORS 설정(origin: 프론트엔드 도메인, method: GET)이 필수.
 */

function extractFilename(url: string, fallbackName: string): string {
  try {
    if (url.startsWith("blob:")) return fallbackName;
    const { pathname } = new URL(url);
    const last = pathname.split("/").pop();
    if (last && last.includes(".")) return decodeURIComponent(last);
  } catch {
    // malformed URL
  }
  return fallbackName;
}

/**
 * 이미지를 기기에 저장.
 *
 * @param url    원본 이미지 URL (GCS URL, blob URL 등)
 * @param index  이미지 순번 — 파일명 fallback에 사용 (0-based)
 * @throws       fetch 실패 또는 share 취소 시 Error 던짐
 */
export async function downloadImage(
  url: string,
  index: number = 0
): Promise<{ iosNewTab: boolean }> {
  const date = new Date().toISOString().slice(0, 10);
  const fallbackName = `율무일기_${date}_${index + 1}.jpg`;
  const filename = extractFilename(url, fallbackName);

  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const blob = await res.blob();

  // URL에 확장자가 없는 경우 Content-Type에서 보완
  let finalFilename = filename;
  if (!filename.includes(".")) {
    const ext = blob.type.split("/")[1] ?? "jpg";
    finalFilename = `율무일기_${date}_${index + 1}.${ext}`;
  }

  const file = new File([blob], finalFilename, { type: blob.type });

  // Web Share API 지원 여부로 분기 (iOS, Android PWA 모두 포함)
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file] });
    return { iosNewTab: false };
  }

  // 데스크톱 fallback: blob → <a download>
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = finalFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);

  return { iosNewTab: false };
}
