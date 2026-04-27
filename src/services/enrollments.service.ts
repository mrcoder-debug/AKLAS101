import { prisma } from "@/lib/prisma";
import { z } from "zod";
import type { Paginated } from "@/schemas/common.schema";
import { listParams } from "@/schemas/common.schema";
import { assertCan } from "./authorization";
import type { ServiceContext } from "./context";
import { requireActor } from "./context";
import { ConflictError, NotFoundError } from "./errors";
import { toEnrollmentDTO, type EnrollmentDTO } from "./dto";
import { parse } from "./_util";
import type { Prisma } from "@prisma/client";

const enrollSchema = z.object({
  courseId: z.string().min(1),
  userIds: z.array(z.string().min(1)).min(1).max(200),
});

const listEnrollmentsSchema = listParams(
  z.enum(["enrolledAt", "status"]),
  z.object({
    courseId: z.string().optional(),
    userId: z.string().optional(),
    status: z.enum(["ACTIVE", "REVOKED"]).optional(),
  }),
);

export async function enrollUsers(
  ctx: ServiceContext,
  rawInput: unknown,
): Promise<EnrollmentDTO[]> {
  const actor = requireActor(ctx);
  const input = parse(enrollSchema, rawInput);

  const course = await prisma.course.findFirst({
    where: { id: input.courseId, deletedAt: null },
  });
  if (!course) throw new NotFoundError("Course");

  assertCan(actor, {
    action: "enrollment:manage",
    resource: { id: course.id, instructorId: course.instructorId },
  });

  const results: EnrollmentDTO[] = [];
  for (const userId of input.userIds) {
    const user = await prisma.user.findFirst({ where: { id: userId, deletedAt: null } });
    if (!user) throw new NotFoundError(`User ${userId}`);
    if (user.role !== "STUDENT") throw new ConflictError(`User ${userId} is not a student`);

    const enrollment = await prisma.enrollment.upsert({
      where: { userId_courseId: { userId, courseId: input.courseId } },
      update: { status: "ACTIVE" },
      create: { userId, courseId: input.courseId, status: "ACTIVE" },
    });
    results.push(toEnrollmentDTO(enrollment));
  }
  return results;
}

export async function revokeEnrollment(
  ctx: ServiceContext,
  enrollmentId: string,
): Promise<EnrollmentDTO> {
  const actor = requireActor(ctx);
  const enrollment = await prisma.enrollment.findUnique({ where: { id: enrollmentId } });
  if (!enrollment) throw new NotFoundError("Enrollment");

  const course = await prisma.course.findFirst({
    where: { id: enrollment.courseId, deletedAt: null },
  });
  if (!course) throw new NotFoundError("Course");

  assertCan(actor, {
    action: "enrollment:manage",
    resource: { id: course.id, instructorId: course.instructorId },
  });

  const updated = await prisma.enrollment.update({
    where: { id: enrollmentId },
    data: { status: "REVOKED" },
  });
  return toEnrollmentDTO(updated);
}

export async function listEnrollments(
  ctx: ServiceContext,
  rawInput: unknown,
): Promise<Paginated<EnrollmentDTO>> {
  const actor = requireActor(ctx);
  assertCan(actor, { action: "enrollment:list" });
  const input = parse(listEnrollmentsSchema, rawInput);

  const where: Prisma.EnrollmentWhereInput = {
    ...(input.filters?.courseId ? { courseId: input.filters.courseId } : {}),
    ...(input.filters?.userId ? { userId: input.filters.userId } : {}),
    ...(input.filters?.status ? { status: input.filters.status } : {}),
    // Scope instructors to their own courses only.
    ...(actor.role === "INSTRUCTOR"
      ? { course: { instructorId: actor.id } }
      : {}),
  };

  const orderBy: Prisma.EnrollmentOrderByWithRelationInput = input.sort
    ? { [input.sort]: input.order ?? "desc" }
    : { enrolledAt: "desc" };

  const [rows, total] = await prisma.$transaction([
    prisma.enrollment.findMany({
      where,
      orderBy,
      skip: (input.page - 1) * input.pageSize,
      take: input.pageSize,
    }),
    prisma.enrollment.count({ where }),
  ]);

  return {
    rows: rows.map(toEnrollmentDTO),
    total,
    page: input.page,
    pageSize: input.pageSize,
    totalPages: Math.ceil(total / input.pageSize),
  };
}

export interface AdminEnrollmentRow {
  id: string;
  userId: string;
  courseId: string;
  enrolledAt: Date;
  status: "ACTIVE" | "REVOKED";
  user: { id: string; name: string; email: string };
  course: { id: string; title: string };
  pct: number;
  isComplete: boolean;
}

export interface AdminEnrollmentStats {
  total: number;
  active: number;
  completed: number;
  completionRate: number;
}

export async function listEnrollmentsAdmin(ctx: ServiceContext): Promise<{
  enrollments: AdminEnrollmentRow[];
  stats: AdminEnrollmentStats;
}> {
  const actor = requireActor(ctx);
  assertCan(actor, { action: "user:list" }); // admin-only action

  const enrollments = await prisma.enrollment.findMany({
    include: {
      user: { select: { id: true, name: true, email: true } },
      course: { select: { id: true, title: true } },
    },
    orderBy: { enrolledAt: "desc" },
    take: 200,
  });

  if (enrollments.length === 0) {
    return { enrollments: [], stats: { total: 0, active: 0, completed: 0, completionRate: 0 } };
  }

  const courseIds = [...new Set(enrollments.map((e) => e.courseId))];
  const userIds = [...new Set(enrollments.map((e) => e.userId))];

  const publishedCounts = await prisma.lesson.groupBy({
    by: ["courseId"],
    where: { courseId: { in: courseIds }, isPublished: true, deletedAt: null },
    _count: { id: true },
  });
  const publishedByCourse = new Map(publishedCounts.map((r) => [r.courseId, r._count.id]));

  const completedRows = await prisma.lessonProgress.findMany({
    where: {
      userId: { in: userIds },
      lesson: { courseId: { in: courseIds }, isPublished: true, deletedAt: null },
    },
    select: { userId: true, lesson: { select: { courseId: true } } },
  });

  const completedByKey = new Map<string, number>();
  for (const r of completedRows) {
    const key = `${r.userId}:${r.lesson.courseId}`;
    completedByKey.set(key, (completedByKey.get(key) ?? 0) + 1);
  }

  const enriched: AdminEnrollmentRow[] = enrollments.map((e) => {
    const total = publishedByCourse.get(e.courseId) ?? 0;
    const done = completedByKey.get(`${e.userId}:${e.courseId}`) ?? 0;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    const isComplete = total > 0 && done >= total;
    return {
      id: e.id,
      userId: e.userId,
      courseId: e.courseId,
      enrolledAt: e.enrolledAt,
      status: e.status,
      user: e.user,
      course: e.course,
      pct,
      isComplete,
    };
  });

  const total = enriched.length;
  const completed = enriched.filter((e) => e.isComplete).length;
  const stats: AdminEnrollmentStats = {
    total,
    active: enriched.filter((e) => e.status === "ACTIVE" && !e.isComplete).length,
    completed,
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
  };

  return { enrollments: enriched, stats };
}

export async function getEnrollment(
  ctx: ServiceContext,
  userId: string,
  courseId: string,
): Promise<EnrollmentDTO | null> {
  const actor = requireActor(ctx);
  const e = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });
  if (!e) return null;

  // Students can only read their own enrollment.
  if (actor.role === "STUDENT" && actor.id !== userId) {
    throw new NotFoundError("Enrollment");
  }
  return toEnrollmentDTO(e);
}
