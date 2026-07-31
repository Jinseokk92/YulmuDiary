"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { api } from "@/lib/api";
import type { AlbumPhotoPageResponse, AlbumPhotoResponse } from "@/types";
import { getMediaUrl } from "@/lib/utils";

const PAGE_SIZE = 30;

export default function AlbumFavoritesPage() {
  const router = useRouter();
  const { resolvedTheme } = useTheme();

  const [mounted, setMounted] = useState(false);
  const [photos, setPhotos] = useState<AlbumPhotoResponse[]>([]);
  const [cursor, setCursor] = useState<number | null>(null);
  const [hasNext, setHasNext] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);

  const loadingRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchFavorites = useCallback(async (nextCursor: number | null, force = false) => {
    if (loadingRef.current) return;
    if (!force && !hasNext && nextCursor !== null) return;

    loadingRef.current = true;
    setLoading(true);
    try {
      const params = new URLSearchParams({ size: String(PAGE_SIZE) });
      if (nextCursor != null) params.set("cursor", String(nextCursor));

      const data = await api.get<AlbumPhotoPageResponse>(`/api/album-photos/me/favorites?${params}`);
      setPhotos((prev) => (nextCursor == null ? data.items : [...prev, ...data.items]));
      setCursor(data.nextCursor);
      setHasNext(data.hasNext);
    } catch {
      if (nextCursor == null) setPhotos([]);
      setHasNext(false);
    } finally {
      loadingRef.current = false;
      setLoading(false);
      setInitialLoaded(true);
    }
  }, [hasNext]);

  useEffect(() => {
    fetchFavorites(null, true);
  }, [fetchFavorites]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNext) {
          fetchFavorites(cursor);
        }
      },
      { rootMargin: "120px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [cursor, hasNext, fetchFavorites]);

  const isDark = mounted && resolvedTheme === "dark";
  const titleColor = isDark ? "text-[#F5F5F5]" : "text-gray-900";
  const subColor = isDark ? "text-[#A8A8A8]" : "text-gray-400";
  const loadingTone = isDark ? "bg-[#1A1A1A]/35" : "bg-slate-50/35";

  return (
    <div>
      <div className="px-4 pt-4 pb-3">
        <h1 className={`text-base font-bold ${titleColor}`}>앨범 즐겨찾기</h1>
        <p className={`text-xs mt-0.5 ${subColor}`}>내가 저장한 사진 모아보기</p>
      </div>

      {!initialLoaded ? (
        <div className={`grid grid-cols-3 gap-0 album-skeleton-soft ${loadingTone}`}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className={`aspect-square ${loadingTone}`} />
          ))}
        </div>
      ) : photos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isDark ? "bg-[#1A1A1A]" : "bg-emerald-50"}`}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-8 h-8 text-emerald-400"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17.25 3.75H6.75A2.25 2.25 0 004.5 6v14.25l7.5-4.5 7.5 4.5V6a2.25 2.25 0 00-2.25-2.25z"
              />
            </svg>
          </div>
          <p className={`text-sm font-medium ${subColor}`}>아직 즐겨찾기한 사진이 없어요</p>
          <p className={`text-xs text-center ${subColor}`}>사진 상세에서 북마크 아이콘으로 저장할 수 있어요</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-px">
            {photos.map((photo) => (
              <button
                key={photo.id}
                onClick={() => router.push(`/album/${photo.id}`)}
                className={`relative aspect-square overflow-hidden active:opacity-75 transition-opacity ${
                  isDark ? "bg-[#1A1A1A]" : "bg-gray-200"
                }`}
              >
                <Image
                  src={getMediaUrl(photo.thumbnailUrl ?? photo.url)}
                  alt={photo.caption ?? "앨범 사진"}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 33vw, 200px"
                  unoptimized={photo.url.startsWith("http://localhost")}
                />
              </button>
            ))}
          </div>

          <div ref={sentinelRef} className="h-12 flex items-center justify-center">
            {loading && (
              <div className="w-5 h-5 border-2 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
            )}
          </div>
        </>
      )}
    </div>
  );
}
