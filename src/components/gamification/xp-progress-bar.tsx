import { Progress } from "@/components/ui/progress";
import type { UserStatsDTO } from "@/services/gamification.service";
import { Zap } from "lucide-react";

interface XpProgressBarProps {
  stats: UserStatsDTO;
  compact?: boolean;
}

export function XpProgressBar({ stats, compact = false }: XpProgressBarProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-2 min-w-0">
        <div className="flex items-center gap-1 shrink-0">
          <Zap className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
          <span className="text-xs font-semibold text-yellow-600 dark:text-yellow-400">
            Lv {stats.level}
          </span>
        </div>
        <Progress value={stats.progressToNextLevel} className="h-1.5 flex-1" />
        <span className="text-xs text-muted-foreground shrink-0">{stats.xp} XP</span>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-1.5 font-semibold">
          <Zap className="h-4 w-4 text-yellow-500 fill-yellow-500" />
          Level {stats.level}
        </div>
        <span className="text-muted-foreground">{stats.xp} XP total</span>
      </div>
      <Progress value={stats.progressToNextLevel} className="h-2" />
      <p className="text-xs text-muted-foreground text-right">
        {stats.xpToNextLevel} XP to Level {stats.level + 1}
      </p>
    </div>
  );
}
