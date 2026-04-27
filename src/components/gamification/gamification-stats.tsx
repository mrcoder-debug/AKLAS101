"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import {
  BookOpen,
  CheckCircle2,
  Flame,
  Zap,
  GraduationCap,
  Star,
  Rocket,
  Award,
  type LucideIcon,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { UserStatsDTO, BadgeDTO } from "@/services/gamification.service";

const BADGE_ICONS: Record<string, LucideIcon> = {
  BookOpen,
  CheckCircle2,
  Flame,
  Zap,
  GraduationCap,
  Star,
  Rocket,
  Award,
};

interface GamificationStatsProps {
  stats: UserStatsDTO;
  badges: BadgeDTO[];
  certificateCount: number;
}

const RING_RADIUS = 38;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function XpRing({ progress }: { progress: number }) {
  const progressRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    const el = progressRef.current;
    if (!el) return;
    const target = RING_CIRCUMFERENCE * (1 - progress / 100);
    el.style.transition = "stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)";
    // Small delay to ensure the animation fires after mount
    const id = setTimeout(() => {
      el.style.strokeDashoffset = String(target);
    }, 60);
    return () => clearTimeout(id);
  }, [progress]);

  return (
    <svg width="96" height="96" viewBox="0 0 96 96" className="rotate-[-90deg]" aria-hidden>
      {/* Track */}
      <circle
        cx="48"
        cy="48"
        r={RING_RADIUS}
        fill="none"
        stroke="currentColor"
        strokeWidth="6"
        className="text-muted/40"
      />
      {/* Progress arc */}
      <circle
        ref={progressRef}
        cx="48"
        cy="48"
        r={RING_RADIUS}
        fill="none"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={RING_CIRCUMFERENCE}
        strokeDashoffset={RING_CIRCUMFERENCE}
        className="text-amber-500"
      />
    </svg>
  );
}

export function GamificationStats({ stats, badges, certificateCount }: GamificationStatsProps) {
  const statChips = [
    { label: "Total XP", value: stats.xp.toLocaleString(), icon: Zap, color: "text-yellow-500" },
    {
      label: "Streak",
      value: `${stats.streakDays}d`,
      icon: Flame,
      color: stats.streakDays >= 7 ? "text-orange-500" : "text-muted-foreground",
    },
    { label: "Badges", value: badges.length, icon: Award, color: "text-purple-500" },
    {
      label: "Certificates",
      value: certificateCount,
      icon: GraduationCap,
      color: "text-amber-600",
    },
  ];

  return (
    <div className="space-y-5 rounded-xl border bg-card p-6">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
        Your Progress
      </h2>

      {/* Level ring + label */}
      <div className="flex items-center gap-6">
        <div className="relative shrink-0">
          <XpRing progress={stats.progressToNextLevel} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider leading-none">
              Lv
            </span>
            <span className="text-2xl font-bold leading-none mt-0.5">{stats.level}</span>
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold">Level {stats.level}</p>
          <p className="text-sm text-muted-foreground mt-0.5">
            {stats.xpToNextLevel.toLocaleString()} XP to Level {stats.level + 1}
          </p>
          <div className="mt-2 flex h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-amber-500 transition-all duration-1000"
              style={{ width: `${stats.progressToNextLevel}%` }}
            />
          </div>
        </div>
      </div>

      {/* Stat chips */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {statChips.map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="flex flex-col gap-1 rounded-lg bg-muted/50 px-3 py-2.5"
          >
            <Icon className={`h-4 w-4 ${color}`} />
            <p className="text-lg font-bold leading-none">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* Badges */}
      {badges.length > 0 && (
        <div>
          <p className="mb-2.5 text-xs font-medium text-muted-foreground">Earned Badges</p>
          <TooltipProvider delayDuration={100}>
            <div className="flex flex-wrap gap-2">
              {badges.map((badge) => {
                const Icon = BADGE_ICONS[badge.iconName] ?? Award;
                return (
                  <Tooltip key={badge.id}>
                    <TooltipTrigger asChild>
                      <div className="flex h-9 w-9 cursor-default items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-amber-200/60 ring-1 ring-amber-200 dark:from-amber-900/30 dark:to-amber-800/20 dark:ring-amber-700/40 transition-transform hover:scale-110">
                        <Icon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      <p className="font-semibold">{badge.name}</p>
                      <p className="text-muted-foreground">{badge.description}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </TooltipProvider>
        </div>
      )}

      {/* Certificate link */}
      {certificateCount > 0 && (
        <p className="text-xs text-muted-foreground">
          <Link href="/student/certificates" className="text-amber-600 dark:text-amber-400 hover:underline font-medium">
            {certificateCount} certificate{certificateCount !== 1 ? "s" : ""} earned
          </Link>
          {" "}— view and share them.
        </p>
      )}
    </div>
  );
}
