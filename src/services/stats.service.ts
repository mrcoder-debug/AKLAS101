import { prisma } from "@/lib/prisma";
import { assertCan } from "./authorization";
import type { ServiceContext } from "./context";
import { requireActor } from "./context";
import type { AuditLogDTO } from "./dto";
import { toAuditLogDTO } from "./dto";

export interface AdminStats {
  userCount: number;
  courseCount: number;
  enrollmentCount: number;
  inactiveUserCount: number;
  pendingInvitationCount: number;
  completionRate: number;
  recentAuditLogs: AuditLogDTO[];
}

export async function getAdminStats(ctx: ServiceContext): Promise<AdminStats> {
  const actor = requireActor(ctx);
  assertCan(actor, { action: "user:list" });

  const [
    userCount,
    courseCount,
    enrollmentCount,
    inactiveUserCount,
    pendingInvitationCount,
    totalProgress,
    publishedLessonCount,
    recentLogs,
  ] = await Promise.all([
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.course.count({ where: { deletedAt: null } }),
    prisma.enrollment.count({ where: { status: "ACTIVE" } }),
    prisma.user.count({ where: { deletedAt: null, isActive: false } }),
    prisma.invitation.count({ where: { status: "PENDING" } }),
    prisma.lessonProgress.count(),
    prisma.lesson.count({ where: { deletedAt: null, isPublished: true } }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { actor: { select: { name: true, email: true } } },
    }),
  ]);

  const totalPossible = enrollmentCount * publishedLessonCount;
  const completionRate =
    totalPossible > 0 ? Math.round((totalProgress / totalPossible) * 100) : 0;

  return {
    userCount,
    courseCount,
    enrollmentCount,
    inactiveUserCount,
    pendingInvitationCount,
    completionRate,
    recentAuditLogs: recentLogs.map(toAuditLogDTO),
  };
}
