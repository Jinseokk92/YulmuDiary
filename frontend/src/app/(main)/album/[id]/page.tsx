"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { useTheme } from "next-themes";
import { api } from "@/lib/api";
import type {
  AlbumPhotoFavoriteResponse,
  AlbumPhotoResponse,
  GrowthPhaseType,
} from "@/types";
import { getMediaUrl } from "@/lib/utils";
import { downloadImage } from "@/lib/download";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { useAuth } from "@/hooks/useAuth";
import { Download, Check, AlertCircle, Loader2 } from "lucide-react";
import ImageViewer from "@/components/diary/ImageViewer";
import type { MediaDto } from "@/types";

function growthLabel(phase: GrowthPhaseType, index: number): string {
  if (phase === "PREGNANCY") return `임신 ${index}주차`;
  if (index === 0) return "신생아";
  return `${index}개월`;
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${y}년 ${Number(m)}월 ${Number(d)}일`;
}

function BookmarkIcon({ active }: { active: boolean }) {
  if (active) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden>
        <path d="M6.75 2.25A3.75 3.75 0 003 6v15a.75.75 0 001.136.643L12 17.14l7.864 4.503A.75.75 0 0021 21V6a3.75 3.75 0 00-3.75-3.75H6.75z" />
      </svg>
    );
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.8}
      stroke="currentColor"
      className="w-5 h-5"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17.25 3.75H6.75A2.25 2.25 0 004.5 6v14.25l7.5-4.5 7.5 4.5V6a2.25 2.25 0 00-2.25-2.25z"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="h-5 w-5"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
      />
    </svg>
  );
}

export default function AlbumDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const { resolvedTheme } = useTheme();
  const { isParent, isLoading: authLoading } = useAuth();

  const [mounted, setMounted] = useState(false);
  const [photo, setPhoto] = useState<AlbumPhotoResponse | null>(null);
  const [notFound, setNotFound] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [favorite, setFavorite] = useState(false);
  const [favoriteReady, setFavoriteReady] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  const [downloadState, setDownloadState] = useState<"idle" | "loading" | "success" | "ios_open" | "error">("idle");
  const [viewerOpen, setViewerOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!id) return;
    api
      .get<AlbumPhotoResponse>(`/api/album-photos/${id}`)
      .then(setPhoto)
      .catch(() => setNotFound(true));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setFavoriteReady(false);

    api
      .get<AlbumPhotoFavoriteResponse>(`/api/album-photos/${id}/favorite`)
      .then((res) => {
        if (cancelled) return;
        setFavorite(res.favorited);
        setFavoriteReady(true);
      })
      .catch(() => {
        if (cancelled) return;
        setFavorite(false);
        setFavoriteReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleToggleFavorite = useCallback(async () => {
    if (!photo || favoriteLoading || !favoriteReady) return;

    const prev = favorite;
    setFavorite(!prev);
    setFavoriteLoading(true);
    try {
      const res = await api.post<AlbumPhotoFavoriteResponse>(`/api/album-photos/${photo.id}/favorite`);
      setFavorite(res.favorited);
    } catch {
      setFavorite(prev);
      alert("즐겨찾기 변경에 실패했습니다.");
    } finally {
      setFavoriteLoading(false);
    }
  }, [photo, favorite, favoriteLoading, favoriteReady]);

  const handleDelete = useCallback(async () => {
    if (!photo || deleting) return;

    setDeleting(true);
    try {
      await api.delete<void>(`/api/album-photos/${photo.id}`);
      router.replace("/album");
      router.refresh();
    } catch {
      alert("앨범 사진 삭제에 실패했습니다.");
      setDeleting(false);
      setConfirmOpen(false);
    }
  }, [photo, deleting, router]);

  const handleDownload = useCallback(async () => {
    if (!photo || downloadState === "loading") return;
    setDownloadState("loading");
    try {
      const { iosNewTab } = await downloadImage(getMediaUrl(photo.url), 0);
      setDownloadState(iosNewTab ? "ios_open" : "success");
      setTimeout(() => setDownloadState("idle"), iosNewTab ? 4000 : 2000);
    } catch {
      setDownloadState("error");
      setTimeout(() => setDownloadState("idle"), 2500);
    }
  }, [photo, downloadState]);

  const isDark = mounted && resolvedTheme === "dark";
  const canDelete = !authLoading && isParent && !!photo;

  const bg = isDark ? "bg-slate-950" : "bg-white";
  const card = isDark ? "bg-slate-900" : "bg-gray-50";
  const title = isDark ? "text-slate-100" : "text-gray-900";
  const sub = isDark ? "text-slate-400" : "text-gray-500";
  const badge = isDark
    ? "bg-emerald-900/50 text-emerald-300"
    : "bg-emerald-50 text-emerald-600";

  if (notFound) {
    return (
      <div className={`min-h-screen ${bg} flex flex-col items-center justify-center gap-3`}>
        <p className={`text-sm ${sub}`}>사진을 찾을 수 없어요</p>
        <button
          onClick={() => router.push("/album")}
          className="text-sm text-emerald-500 underline"
        >
          앨범으로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <>
      <div className={`min-h-screen ${bg}`}>
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <button
            onClick={() => router.back()}
            className={`flex items-center gap-1.5 text-sm font-medium ${sub}
                       active:opacity-60 transition-opacity`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            앨범
          </button>

          <div className="flex items-center gap-3">
            {canDelete && (
              <button
                onClick={() => setConfirmOpen(true)}
                disabled={deleting}
                aria-label="삭제"
                className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors
                            disabled:opacity-40 active:scale-[0.98]
                            ${isDark
                              ? "text-slate-400 hover:bg-slate-800 hover:text-red-400"
                              : "text-gray-400 hover:bg-gray-100 hover:text-red-500"}`}
              >
                <TrashIcon />
              </button>
            )}
          </div>
        </div>

        {!photo ? (
          <div className="animate-pulse">
            <div className="aspect-square w-full bg-gray-200" />
            <div className="px-4 py-5 space-y-3">
              <div className="h-5 w-20 bg-gray-200 rounded-full" />
              <div className="h-4 w-28 bg-gray-200 rounded" />
              <div className="h-4 w-48 bg-gray-200 rounded" />
            </div>
          </div>
        ) : (
          <>
            <div
              className="relative w-full aspect-square bg-black cursor-pointer"
              onClick={() => setViewerOpen(true)}
              role="button"
              aria-label="사진 확대 보기"
            >
              {(() => {
                const src = getMediaUrl(photo.url);
                return (
                  <Image
                    src={src}
                    alt={photo.caption ?? "앨범 사진"}
                    fill
                    className="object-contain"
                    sizes="100vw"
                    priority
                    unoptimized={
                      src.startsWith("http://localhost") ||
                      src.startsWith("data:") ||
                      src.startsWith("blob:")
                    }
                  />
                );
              })()}
              <button
                type="button"
                onClick={handleToggleFavorite}
                disabled={favoriteLoading || !favoriteReady}
                aria-label={favorite ? "즐겨찾기 해제" : "즐겨찾기"}
                className={`absolute bottom-3 right-3 z-10 flex h-11 w-11 items-center justify-center rounded-full transition
                            active:scale-[0.97] disabled:opacity-40
                            ${favorite
                              ? "bg-emerald-500 text-white ring-1 ring-white/40 shadow-lg shadow-emerald-900/40"
                              : "bg-black/45 text-white ring-1 ring-white/30 backdrop-blur-sm"}`}
              >
                <BookmarkIcon active={favorite} />
              </button>
            </div>

            <div className={`${card} px-4 py-5 space-y-4`}>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${badge}`}>
                {growthLabel(photo.growthPhaseType, photo.growthIndex)}
              </span>

              <div className="flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className={`w-4 h-4 shrink-0 ${sub}`}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
                  />
                </svg>
                <p className={`text-sm ${sub}`}>
                  {photo.takenAt ? formatDate(photo.takenAt) : formatDate(photo.createdAt.slice(0, 10))}
                </p>
              </div>

              {photo.caption && <p className={`text-sm leading-relaxed ${title}`}>{photo.caption}</p>}

              <div
                className={`flex items-center gap-1.5 pt-1 border-t ${
                  isDark ? "border-slate-800" : "border-gray-100"
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className={`w-4 h-4 shrink-0 ${sub}`}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                  />
                </svg>
                <p className={`text-xs ${sub}`}>{photo.uploaderNickname}</p>
              </div>

              {/* ── 다운로드 버튼 ── */}
              <button
                onClick={handleDownload}
                disabled={downloadState === "loading"}
                aria-label="사진 저장"
                className={`w-full py-3.5 rounded-xl flex items-center justify-center gap-2
                            text-sm font-semibold transition-colors active:opacity-75 disabled:opacity-50
                            ${downloadState === "success"
                              ? isDark ? "bg-emerald-900/50 text-emerald-300" : "bg-emerald-50 text-emerald-600"
                              : downloadState === "ios_open"
                              ? isDark ? "bg-blue-900/40 text-blue-300" : "bg-blue-50 text-blue-600"
                              : downloadState === "error"
                              ? isDark ? "bg-red-900/40 text-red-300" : "bg-red-50 text-red-500"
                              : isDark ? "bg-slate-800 text-slate-200 hover:bg-slate-700"
                                       : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
              >
                {downloadState === "loading"  && <Loader2 className="w-4 h-4 animate-spin" />}
                {downloadState === "success"  && <Check className="w-4 h-4" />}
                {downloadState === "ios_open" && <Check className="w-4 h-4" />}
                {downloadState === "error"    && <AlertCircle className="w-4 h-4" />}
                {downloadState === "idle"     && <Download className="w-4 h-4" />}
                <span>
                  {downloadState === "idle"     && "사진 저장"}
                  {downloadState === "loading"  && "저장 중..."}
                  {downloadState === "success"  && "저장됨"}
                  {downloadState === "ios_open" && "새 탭에서 이미지를 길게 눌러 저장해 주세요"}
                  {downloadState === "error"    && "저장 실패 — 다시 시도해 주세요"}
                </span>
              </button>
            </div>
          </>
        )}
      </div>

      {/* 이미지 확대 뷰어 */}
      {viewerOpen && photo && (() => {
        const viewerMedia: MediaDto[] = [{
          id: photo.id,
          url: photo.url,
          thumbnailUrl: photo.thumbnailUrl,
          type: "PHOTO",
          displayOrder: 0,
        }];
        return (
          <ImageViewer
            media={viewerMedia}
            initialIndex={0}
            onClose={() => setViewerOpen(false)}
          />
        );
      })()}

      <ConfirmModal
        open={confirmOpen}
        title="앨범 사진을 삭제할까요?"
        description="삭제된 사진은 복구할 수 없습니다."
        confirmLabel="삭제"
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
        loading={deleting}
      />
    </>
  );
}
