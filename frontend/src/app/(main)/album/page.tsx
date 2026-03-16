"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import type { AlbumPhotoPageResponse } from "@/types";
import AlbumGrid from "@/components/album/AlbumGrid";
import AlbumLoading from "./loading";

const BABY_ID = 1;
const PAGE_SIZE = 20;

const EMPTY: AlbumPhotoPageResponse = { items: [], nextCursor: null, hasNext: false };

export default function AlbumPage() {
  const [data, setData] = useState<AlbumPhotoPageResponse | null>(null);

  useEffect(() => {
    console.log("[AlbumPage] useEffect 실행 — 데이터 로드 시작");
    api
      .get<AlbumPhotoPageResponse>(`/api/album-photos?babyId=${BABY_ID}&size=${PAGE_SIZE}`)
      .then((data) => {
        console.log("[AlbumPage] 데이터 수신 — 사진 수:", data?.items?.length, data);
        setData(data);
      })
      .catch((err) => {
        console.error("[AlbumPage] 데이터 로드 실패:", err);
        setData(EMPTY);
      });
  }, []);

  if (!data) return <AlbumLoading />;

  return <AlbumGrid initialData={data} />;
}
