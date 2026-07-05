import { Skeleton } from "@/components/ui/skeleton";

export function BookCardSkeleton({ fluid = false }) {
  return (
    <div className={fluid ? "w-full" : "w-40 shrink-0"}>
      <Skeleton className="aspect-2/3 w-full rounded-sm" />
      <Skeleton className="mt-2 h-4 w-3/4" />
      <Skeleton className="mt-1.5 h-3 w-1/2" />
    </div>
  );
}

export function BookGridSkeleton({
  count = 8,
  className = "grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4",
  fluid = true,
}) {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, i) => (
        <BookCardSkeleton key={i} fluid={fluid} />
      ))}
    </div>
  );
}
