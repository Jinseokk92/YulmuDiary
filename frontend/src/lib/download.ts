/**
 * 이미지 다운로드 유틸
 *
 * 모든 플랫폼(Android, iOS, 데스크톱)에서 동일하게
 * fetch → blob → URL.createObjectURL → <a download> 방식으로 저장.
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
 * @throws       fetch 실패 시 Error 던짐
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

  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = finalFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // 클릭 직후 revoke하면 일부 브라우저에서 다운로드가 취소되므로 짧게 지연
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);

  return { iosNewTab: false };
}
