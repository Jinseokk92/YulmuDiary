import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { api } from "@/lib/api";
import type { AlbumPhotoPageResponse } from "@/types";
import AlbumGrid from "@/components/album/AlbumGrid";

const BABY_ID = 1;
const PAGE_SIZE = 20;

export default async function AlbumPage() {
  const cookieStore = await cookies();
  if (!cookieStore.get("access_token")?.value) redirect("/login");

  let data: AlbumPhotoPageResponse;
  try {
    data = await api.server.get<AlbumPhotoPageResponse>(
      `/api/album-photos?babyId=${BABY_ID}&size=${PAGE_SIZE}`
    );
  } catch {
    data = { items: [], nextCursor: null, hasNext: false };
  }

  return <AlbumGrid initialData={data} />;
}
