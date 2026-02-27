import Skeleton from "@/components/ui/Skeleton";

export default function DiaryPostSkeleton() {
  return (
    <div className="bg-white border-b border-gray-100">
      {/* 헤더: 아바타 + 이름 + 시간 */}
      <div className="flex items-center gap-3 px-4 py-3">
        <Skeleton className="w-9 h-9 rounded-full shrink-0" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>

      {/* 이미지 영역 */}
      <Skeleton className="w-full aspect-square rounded-none" />

      {/* 리액션 바 */}
      <div className="flex gap-2 px-4 pt-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-12 rounded-full" />
        ))}
      </div>

      {/* 본문 */}
      <div className="px-4 py-3 space-y-2">
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-3/4" />
      </div>
    </div>
  );
}
