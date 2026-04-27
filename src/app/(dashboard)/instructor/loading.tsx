import { CardSkeleton } from "@/components/skeletons/card-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function InstructorLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-56" />
      <CardSkeleton />
    </div>
  );
}
