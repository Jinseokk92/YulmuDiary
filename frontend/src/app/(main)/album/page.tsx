"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { Trophy } from "lucide-react";
import { api } from "@/lib/api";
import type { AlbumPhotoPageResponse, BestPhotoStatusResponse } from "@/types";
import AlbumGrid from "@/components/album/AlbumGrid";
import AlbumLoading from "./loading";

const BABY_ID = 1;
const PAGE_SIZE = 20;

const EMPTY: AlbumPhotoPageResponse = { items: [], nextCursor: null, hasNext: false };

export default function AlbumPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<AlbumPhotoPageResponse | null>(null);
  const [bestPhotoStatus, setBestPhotoStatus] = useState<BestPhotoStatusResponse | null>(null);

  useEffect(() => {
    setMounted(true);

    api
      .get<AlbumPhotoPageResponse>(`/api/album-photos?babyId=${BABY_ID}&size=${PAGE_SIZE}`)
      .then(setData)
      .catch(() => setData(EMPTY));

    api.get<BestPhotoStatusResponse>("/api/best-photo/status")
      .then((s) => { if (s?.status === "NOMINATING") setBestPhotoStatus(s); })
      .catch(() => {});
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  if (!data) return <AlbumLoading />;

  return (
    <>
      {/* 베스트 포토 추천 배너 */}
      {bestPhotoStatus?.status === "NOMINATING" && (
        <div className={`mx-4 mt-3 mb-1 rounded-2xl px-4 py-3 flex items-center gap-3
          ${isDark ? "bg-amber-900/20 border border-amber-800/40" : "bg-amber-50 border border-amber-200"}`}>
          <Trophy size={18} className="text-amber-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold ${isDark ? "text-amber-300" : "text-amber-800"}`}>
              베스트 포토 추천 중!
            </p>
            <p className={`text-xs mt-0.5 ${isDark ? "text-amber-400/70" : "text-amber-600/80"}`}>
              사진을 눌러 이달의 베스트 포토로 추천해 보세요
            </p>
          </div>
          <Link
            href="/album"
            className={`text-xs font-semibold shrink-0 ${isDark ? "text-amber-400" : "text-amber-600"}`}
            aria-label="현재 페이지"
          >
            {bestPhotoStatus.totalNominations}장 추천됨
          </Link>
        </div>
      )}
      <AlbumGrid initialData={data} />
    </>
  );
}
