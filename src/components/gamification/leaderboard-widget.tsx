import { getLeaderboard } from "@/services/gamification.service";
import type { ServiceContext } from "@/services/context";
import { Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/cn";

interface LeaderboardWidgetProps {
  ctx: ServiceContext;
  limit?: number;
}

export async function LeaderboardWidget({ ctx, limit = 10 }: LeaderboardWidgetProps) {
  let entries;
  try {
    entries = await getLeaderboard(ctx, limit);
  } catch {
    return null;
  }

  if (entries.length === 0) return null;

  const medalColors: Record<number, string> = {
    1: "text-yellow-500",
    2: "text-slate-400",
    3: "text-amber-600",
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Trophy className="h-4 w-4 text-yellow-500" />
          Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y">
          {entries.map((entry) => (
            <li
              key={entry.userId}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 text-sm",
                entry.isCurrentUser && "bg-primary/5 font-semibold",
              )}
            >
              <span
                className={cn(
                  "w-5 text-center font-mono text-xs font-bold shrink-0",
                  medalColors[entry.rank] ?? "text-muted-foreground",
                )}
              >
                {entry.rank}
              </span>
              <span className="flex-1 truncate">{entry.name}</span>
              <div className="flex items-center gap-1.5 shrink-0 text-muted-foreground">
                <span className="text-xs">Lv {entry.level}</span>
                <span className="text-xs font-medium text-foreground">{entry.xp} XP</span>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
