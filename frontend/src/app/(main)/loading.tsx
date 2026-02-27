import Skeleton from "@/components/ui/Skeleton";

export default function MainLoading() {
  return (
    <div className="px-4 py-6 space-y-6">
      <Skeleton className="h-28 w-full rounded-2xl" />
      <div className="flex justify-center">
        <Skeleton className="w-40 h-40 rounded-full" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
      </div>
    </div>
  );
}
