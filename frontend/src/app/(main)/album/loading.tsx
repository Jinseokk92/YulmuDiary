import Skeleton from "@/components/ui/Skeleton";

export default function AlbumLoading() {
  const loadingTone = "bg-slate-50/35 dark:bg-[#1A1A1A]/35";

  return (
    <div>
      <div className="px-4 pt-4 pb-3 space-y-1.5">
        <Skeleton
          className="h-4 w-12 !animate-none !bg-slate-50/45 dark:!bg-[#1A1A1A]/45 album-skeleton-soft"
        />
        <Skeleton
          className="h-3 w-32 !animate-none !bg-slate-50/45 dark:!bg-[#1A1A1A]/45 album-skeleton-soft"
        />
      </div>
      <div className={`grid grid-cols-3 gap-0 album-skeleton-soft ${loadingTone}`}>
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className={`aspect-square ${loadingTone}`} />
        ))}
      </div>
    </div>
  );
}
