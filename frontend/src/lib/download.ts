/**
 * 이미지 다운로드 유틸
 *
 * 모바일 (iOS · Android): Web Share API → 공유 시트에서 갤러리 저장
 * 데스크톱: blob → <a download>
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
 * blob.type 이 비어있거나 application/octet-stream 이면 URL 확장자로 추정.
 * canShare()는 type이 빈 문자열이면 false를 반환하므로 반드시 명시적으로 설정해야 한다.
 */
function resolveMimeType(blobType: string, url: string): string {
  if (blobType && blobType !== "application/octet-stream") return blobType;
  const ext = url.split("?")[0].split(".").pop()?.toLowerCase() ?? "";
  const mimeMap: Record<string, string> = {
    jpg:  "image/jpeg",
    jpeg: "image/jpeg",
    png:  "image/png",
    gif:  "image/gif",
    webp: "image/webp",
    heic: "image/heic",
    heif: "image/heif",
  };
  return mimeMap[ext] ?? "image/jpeg";
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

  console.log("[download] 시작:", { url: url.slice(0, 80), filename });

  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const blob = await res.blob();

  console.log("[download] fetch 완료 — blob.type:", JSON.stringify(blob.type), "size:", blob.size);

  // MIME 타입 확정 (blob.type 빈 문자열 · octet-stream 대비)
  const mimeType = resolveMimeType(blob.type, url);
  console.log("[download] 확정 mimeType:", mimeType);

  // 파일명 확장자 보완
  let finalFilename = filename;
  if (!filename.includes(".")) {
    const ext = mimeType.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
    finalFilename = `율무일기_${date}_${index + 1}.${ext}`;
  }

  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  console.log("[download] isMobile:", isMobile);

  // ── 모바일: Web Share API ───────────────────────────────────────────────────
  if (isMobile) {
    const file = new File([blob], finalFilename, { type: mimeType });
    const canShare = navigator.canShare?.({ files: [file] }) ?? false;
    console.log("[download] canShare:", canShare);

    if (canShare) {
      await navigator.share({ files: [file] });
      console.log("[download] Web Share API 성공");
      return { iosNewTab: false };
    }
  }

  // ── 데스크톱 (또는 모바일 canShare 미지원): blob → <a download> ────────────
  const blobForDownload = mimeType !== blob.type
    ? new Blob([blob], { type: mimeType })
    : blob;
  const objectUrl = URL.createObjectURL(blobForDownload);
  console.log("[download] <a download> 시도:", finalFilename);

  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = finalFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);

  return { iosNewTab: false };
}
