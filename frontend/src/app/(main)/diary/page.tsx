import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { api } from "@/lib/api";
import type { DiaryPostPageResponse } from "@/types";
import DiaryFeed from "@/components/diary/DiaryFeed";

const BABY_ID = 1;

export default async function DiaryPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) {
    redirect("/login");
  }

  const firstPage = await api.server.get<DiaryPostPageResponse>(
    `/api/diary-posts?babyId=${BABY_ID}&size=10`
  );

  return (
    <DiaryFeed
      initialItems={firstPage.items}
      initialNextCursor={firstPage.nextCursor}
      initialHasNext={firstPage.hasNext}
      babyId={BABY_ID}
    />
  );
}
