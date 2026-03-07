import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { api } from "@/lib/api";
import type { DiaryPostPaginatedResponse } from "@/types";
import DiaryFeed from "@/components/diary/DiaryFeed";

const BABY_ID = 1;
const PAGE_SIZE = 5;

export default async function DiaryPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) {
    redirect("/login");
  }

  const { page: pageParam } = await searchParams;
  const currentPage = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  const data = await api.server.get<DiaryPostPaginatedResponse>(
    `/api/diary-posts/pages?babyId=${BABY_ID}&page=${currentPage}&size=${PAGE_SIZE}`
  );

  return <DiaryFeed data={data} currentPage={currentPage} />;
}
