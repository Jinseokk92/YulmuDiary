import DiaryPostSkeleton from "@/components/diary/DiaryPostSkeleton";

export default function DiaryLoading() {
  return (
    <div>
      {Array.from({ length: 3 }).map((_, i) => (
        <DiaryPostSkeleton key={i} />
      ))}
    </div>
  );
}
