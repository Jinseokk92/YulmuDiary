/**
 * 이미지 다운로드 유틸
 *
 * Case 1: 데스크톱 — GCS fetch → blob → <a download>
 * Case 2: 모바일 + Web Share API 지원 (일반 브라우저) — GCS fetch → blob → navigator.share
 * Case 3: 모바일 + 인앱 브라우저 (Web Share 불가) — 백엔드 프록시 → blob → <a download>
 *
 * GCS CORS 설정(origin: 프론트엔드 도메인, method: GET)이 Case 1/2에서 필수.
 */

import { getAccessToken } from "@/stores/authStore";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080").replace(/\/$/, "");

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

function triggerBlobDownload(blob: Blob, filename: string): void {
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
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

  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  // 카카오톡, 네이버, Line, Instagram, Facebook IAB
  const isInApp = /KAKAOTALK|NAVER|Line\/|Instagram|FB_IAB|FBAN/i.test(navigator.userAgent);

  console.log("[download] 시작:", { url: url.slice(0, 80), isMobile, isInApp });

  // ── Case 1: 데스크톱 — GCS fetch → blob → <a download> ─────────────────────
  if (!isMobile) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    const mimeType = resolveMimeType(blob.type, url);
    let finalFilename = filename;
    if (!filename.includes(".")) {
      const ext = mimeType.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
      finalFilename = `율무일기_${date}_${index + 1}.${ext}`;
    }
    const blobToDownload = mimeType !== blob.type
      ? new Blob([blob], { type: mimeType })
      : blob;
    triggerBlobDownload(blobToDownload, finalFilename);
    console.log("[download] 데스크톱 blob download 완료");
    return { iosNewTab: false };
  }

  // ── Case 2: 모바일 일반 브라우저 — Web Share API ────────────────────────────
  if (!isInApp) {
    const estimatedMime = resolveMimeType("", url);
    const probeFile = new File([""], "probe.jpg", { type: estimatedMime });
    const canShare = navigator.canShare?.({ files: [probeFile] }) ?? false;
    console.log("[download] canShare:", canShare);

    if (canShare) {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const mimeType = resolveMimeType(blob.type, url);
      let finalFilename = filename;
      if (!filename.includes(".")) {
        const ext = mimeType.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
        finalFilename = `율무일기_${date}_${index + 1}.${ext}`;
      }
      const file = new File([blob], finalFilename, { type: mimeType });
      await navigator.share({ files: [file] });
      console.log("[download] Web Share API 성공");
      return { iosNewTab: false };
    }
  }

  // ── Case 3: 인앱 브라우저 또는 Web Share 미지원 — 백엔드 프록시 ─────────────
  const estimatedMime = resolveMimeType("", url);
  let finalFilename = filename;
  if (!filename.includes(".")) {
    const ext = estimatedMime.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
    finalFilename = `율무일기_${date}_${index + 1}.${ext}`;
  }

  const token = getAccessToken();
  const proxyUrl = `${API_BASE_URL}/api/media/download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(finalFilename)}`;
  console.log("[download] 백엔드 프록시 요청:", proxyUrl.slice(0, 120));

  const proxyRes = await fetch(proxyUrl, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: "include",
  });
  if (!proxyRes.ok) throw new Error(`프록시 HTTP ${proxyRes.status}`);

  const proxyBlob = await proxyRes.blob();
  console.log("[download] 프록시 blob 수신, size:", proxyBlob.size);

  try {
    triggerBlobDownload(proxyBlob, finalFilename);
    console.log("[download] 프록시 blob download 완료");
  } catch {
    // 인앱 브라우저에서 blob URL 미지원 시 새 탭 fallback
    console.warn("[download] blob download 실패 → window.open fallback");
    window.open(proxyUrl, "_blank");
  }

  return { iosNewTab: false };
}
