import { Flame } from "lucide-react";
import { cn } from "@/lib/cn";

interface StreakBadgeProps {
  streakDays: number;
  className?: string;
}

export function StreakBadge({ streakDays, className }: StreakBadgeProps) {
  if (streakDays < 1) return null;

  const isHot = streakDays >= 7;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
        isHot
          ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
          : "bg-muted text-muted-foreground",
        className,
      )}
    >
      <Flame
        className={cn(
          "h-3.5 w-3.5",
          isHot ? "fill-orange-500 text-orange-500" : "text-muted-foreground",
        )}
      />
      {streakDays} day{streakDays !== 1 ? "s" : ""}
    </div>
  );
}
