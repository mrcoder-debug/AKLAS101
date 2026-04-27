import { prisma } from "@/lib/prisma";
import type { Prisma, BadgeSlug } from "@prisma/client";
import type { ServiceContext } from "./context";
import { requireActor } from "./context";

export interface UserStatsDTO {
  userId: string;
  xp: number;
  level: number;
  streakDays: number;
  longestStreak: number;
  lastActivityAt: Date | null;
  xpToNextLevel: number;
  progressToNextLevel: number; // 0-100
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string; // privacy-truncated: "Sam S."
  xp: number;
  level: number;
  isCurrentUser: boolean;
}

export interface BadgeDTO {
  id: string;
  slug: string;
  name: string;
  description: string;
  iconName: string;
  xpReward: number;
  earnedAt: Date;
}

function xpForLevel(level: number): number {
  return level * 100;
}

function calcLevel(xp: number): number {
  let level = 1;
  let accumulated = 0;
  while (accumulated + xpForLevel(level) <= xp) {
    accumulated += xpForLevel(level);
    level += 1;
  }
  return level;
}

function toStatsDTO(stats: {
  userId: string;
  xp: number;
  level: number;
  streakDays: number;
  longestStreak: number;
  lastActivityAt: Date | null;
}): UserStatsDTO {
  const xpForCurrentLevel = xpForLevel(stats.level);
  let accumulated = 0;
  for (let i = 1; i < stats.level; i++) accumulated += xpForLevel(i);
  const xpInCurrentLevel = stats.xp - accumulated;
  return {
    userId: stats.userId,
    xp: stats.xp,
    level: stats.level,
    streakDays: stats.streakDays,
    longestStreak: stats.longestStreak,
    lastActivityAt: stats.lastActivityAt,
    xpToNextLevel: xpForCurrentLevel - xpInCurrentLevel,
    progressToNextLevel:
      xpForCurrentLevel > 0
        ? Math.min(100, Math.round((xpInCurrentLevel / xpForCurrentLevel) * 100))
        : 100,
  };
}

function truncateName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0] ?? name;
  const first = parts[0] ?? "";
  const last = parts[parts.length - 1] ?? "";
  return `${first} ${last[0] ?? ""}.`;
}

type Tx = Prisma.TransactionClient;

export async function getOrCreateStats(tx: Tx, userId: string) {
  return tx.userStats.upsert({
    where: { userId },
    update: {},
    create: { userId, xp: 0, level: 1, streakDays: 0, longestStreak: 0 },
  });
}

export async function awardXP(tx: Tx, userId: string, amount: number): Promise<void> {
  const stats = await getOrCreateStats(tx, userId);
  const newXp = stats.xp + amount;
  const newLevel = calcLevel(newXp);

  const updated = await tx.userStats.update({
    where: { userId },
    data: { xp: newXp, level: newLevel },
  });

  await checkAndAwardBadges(tx, userId, updated);
}

export async function updateStreak(tx: Tx, userId: string): Promise<void> {
  const stats = await getOrCreateStats(tx, userId);
  const now = new Date();
  const last = stats.lastActivityAt;

  let newStreak = stats.streakDays;

  if (!last) {
    newStreak = 1;
  } else {
    const lastDay = new Date(last);
    lastDay.setHours(0, 0, 0, 0);
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.round((today.getTime() - lastDay.getTime()) / 86400000);

    if (diffDays === 0) {
      // Same day — streak already counted
      return;
    } else if (diffDays === 1) {
      newStreak = stats.streakDays + 1;
      await awardXP(tx, userId, 5);
    } else {
      newStreak = 1;
    }
  }

  const newLongest = Math.max(newStreak, stats.longestStreak);

  await tx.userStats.update({
    where: { userId },
    data: {
      streakDays: newStreak,
      longestStreak: newLongest,
      lastActivityAt: now,
    },
  });
}

async function checkAndAwardBadges(
  tx: Tx,
  userId: string,
  stats: {
    xp: number;
    level: number;
    streakDays: number;
    longestStreak: number;
  },
): Promise<void> {
  const earned = await tx.userBadge.findMany({
    where: { userId },
    select: { badge: { select: { slug: true } } },
  });
  const earnedSlugs = new Set(earned.map((ub) => ub.badge.slug));

  const toAward: BadgeSlug[] = [];

  const lessonCount = await tx.lessonProgress.count({ where: { userId } });
  if (lessonCount >= 1 && !earnedSlugs.has("FIRST_LESSON")) toAward.push("FIRST_LESSON");

  const passedAttempts = await tx.quizAttempt.count({ where: { userId, passed: true, submittedAt: { not: null } } });
  if (passedAttempts >= 1 && !earnedSlugs.has("FIRST_QUIZ_PASS")) toAward.push("FIRST_QUIZ_PASS");

  const perfectAttempts = await tx.quizAttempt.count({ where: { userId, score: 100, submittedAt: { not: null } } });
  if (perfectAttempts >= 1 && !earnedSlugs.has("PERFECT_QUIZ")) toAward.push("PERFECT_QUIZ");

  const completedCourses = await countCompletedCourses(tx, userId);
  if (completedCourses >= 1 && !earnedSlugs.has("COURSE_COMPLETE")) toAward.push("COURSE_COMPLETE");

  if (stats.longestStreak >= 7 && !earnedSlugs.has("STREAK_7")) toAward.push("STREAK_7");
  if (stats.longestStreak >= 30 && !earnedSlugs.has("STREAK_30")) toAward.push("STREAK_30");

  if (toAward.length === 0) return;

  const badges = await tx.badge.findMany({
    where: { slug: { in: toAward } },
  });

  for (const badge of badges) {
    await tx.userBadge.create({
      data: { userId, badgeId: badge.id },
    });
    if (badge.xpReward > 0) {
      await tx.userStats.update({
        where: { userId },
        data: {
          xp: { increment: badge.xpReward },
          level: calcLevel(stats.xp + badge.xpReward),
        },
      });
    }
  }
}

async function countCompletedCourses(tx: Tx, userId: string): Promise<number> {
  const enrollments = await tx.enrollment.findMany({
    where: { userId, status: "ACTIVE" },
    select: { courseId: true },
  });

  let completed = 0;
  for (const e of enrollments) {
    const [published, done] = await Promise.all([
      tx.lesson.count({ where: { courseId: e.courseId, isPublished: true, deletedAt: null } }),
      tx.lessonProgress.count({
        where: {
          userId,
          lesson: { courseId: e.courseId, isPublished: true, deletedAt: null },
        },
      }),
    ]);
    if (published > 0 && done >= published) completed++;
  }
  return completed;
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function getMyStats(ctx: ServiceContext): Promise<UserStatsDTO> {
  const actor = requireActor(ctx);
  const stats = await prisma.userStats.findUnique({ where: { userId: actor.id } });
  if (!stats) {
    return toStatsDTO({ userId: actor.id, xp: 0, level: 1, streakDays: 0, longestStreak: 0, lastActivityAt: null });
  }
  return toStatsDTO(stats);
}

export async function getMyBadges(ctx: ServiceContext): Promise<BadgeDTO[]> {
  const actor = requireActor(ctx);
  const rows = await prisma.userBadge.findMany({
    where: { userId: actor.id },
    include: { badge: true },
    orderBy: { earnedAt: "asc" },
  });
  return rows.map((ub) => ({
    id: ub.badge.id,
    slug: ub.badge.slug,
    name: ub.badge.name,
    description: ub.badge.description,
    iconName: ub.badge.iconName,
    xpReward: ub.badge.xpReward,
    earnedAt: ub.earnedAt,
  }));
}

export async function getLeaderboard(
  ctx: ServiceContext,
  limit = 10,
): Promise<LeaderboardEntry[]> {
  const actor = requireActor(ctx);
  const rows = await prisma.userStats.findMany({
    orderBy: { xp: "desc" },
    take: limit,
    include: { user: { select: { id: true, name: true } } },
  });

  return rows.map((r, i) => ({
    rank: i + 1,
    userId: r.userId,
    name: truncateName(r.user.name),
    xp: r.xp,
    level: r.level,
    isCurrentUser: r.userId === actor.id,
  }));
}
