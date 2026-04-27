import { prisma } from "@/lib/prisma";
import { assertCan } from "./authorization";
import type { ServiceContext } from "./context";
import { requireActor } from "./context";
import { NotFoundError } from "./errors";
import { toProgressDTO, type ProgressDTO } from "./dto";
import { awardXP, updateStreak } from "./gamification.service";
import { awardCertificate } from "./certificate.service";

export interface CourseProgress {
  totalPublished: number;
  completed: number;
  percentage: number;
  completedLessonIds: string[];
}

export interface MarkLessonCompleteResult {
  progress: ProgressDTO;
  certificateIssued: boolean;
}

export async function markLessonComplete(
  ctx: ServiceContext,
  lessonId: string,
): Promise<MarkLessonCompleteResult> {
  const actor = requireActor(ctx);

  const lesson = await prisma.lesson.findFirst({
    where: { id: lessonId, deletedAt: null, isPublished: true },
  });
  if (!lesson) throw new NotFoundError("Lesson");

  const course = await prisma.course.findFirst({
    where: { id: lesson.courseId, deletedAt: null },
  });
  if (!course) throw new NotFoundError("Course");

  const e = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: actor.id, courseId: lesson.courseId } },
  });

  assertCan(actor, {
    action: "lesson:markComplete",
    resource: {
      course: { id: course.id, instructorId: course.instructorId },
      lesson: { id: lesson.id, courseId: lesson.courseId, isPublished: lesson.isPublished },
      enrollment: e ? { id: e.id, userId: e.userId, courseId: e.courseId, status: e.status } : null,
    },
  });

  // Idempotent upsert — marking twice is a no-op.
  const [progress, certificateIssued] = await prisma.$transaction(async (tx) => {
    const existing = await tx.lessonProgress.findUnique({
      where: { userId_lessonId: { userId: actor.id, lessonId } },
    });
    if (existing) return [existing, false] as const;
    const created = await tx.lessonProgress.create({
      data: { userId: actor.id, lessonId },
    });
    await awardXP(tx, actor.id, 10);
    await updateStreak(tx, actor.id);

    // Check if this completes the course.
    const [published, completed] = await Promise.all([
      tx.lesson.count({ where: { courseId: lesson.courseId, isPublished: true, deletedAt: null } }),
      tx.lessonProgress.count({
        where: { userId: actor.id, lesson: { courseId: lesson.courseId, isPublished: true, deletedAt: null } },
      }),
    ]);
    if (published > 0 && completed >= published) {
      await awardXP(tx, actor.id, 100);
      await awardCertificate(tx, actor.id, lesson.courseId);
      return [created, true] as const;
    }

    return [created, false] as const;
  });

  return { progress: toProgressDTO(progress), certificateIssued };
}

export async function getCourseProgress(
  ctx: ServiceContext,
  courseId: string,
  userId?: string,
): Promise<CourseProgress> {
  const actor = requireActor(ctx);

  // Students can only read their own progress.
  const targetUserId =
    actor.role === "STUDENT" ? actor.id : (userId ?? actor.id);

  const [publishedLessons, completedRows] = await prisma.$transaction([
    prisma.lesson.findMany({
      where: { courseId, deletedAt: null, isPublished: true },
      select: { id: true },
    }),
    prisma.lessonProgress.findMany({
      where: {
        userId: targetUserId,
        lesson: { courseId, deletedAt: null, isPublished: true },
      },
      select: { lessonId: true },
    }),
  ]);

  const total = publishedLessons.length;
  const completed = completedRows.length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    totalPublished: total,
    completed,
    percentage,
    completedLessonIds: completedRows.map((r) => r.lessonId),
  };
}

export async function getProgressForCourses(
  ctx: ServiceContext,
  courseIds: string[],
): Promise<Map<string, CourseProgress>> {
  const actor = requireActor(ctx);
  const map = new Map<string, CourseProgress>();

  // Batch: one query for all published lessons, one for completed.
  const [allLessons, completedRows] = await prisma.$transaction([
    prisma.lesson.findMany({
      where: { courseId: { in: courseIds }, deletedAt: null, isPublished: true },
      select: { id: true, courseId: true },
    }),
    prisma.lessonProgress.findMany({
      where: {
        userId: actor.id,
        lesson: { courseId: { in: courseIds }, deletedAt: null, isPublished: true },
      },
      select: { lessonId: true, lesson: { select: { courseId: true } } },
    }),
  ]);

  const completedByCourse = new Map<string, Set<string>>();
  for (const r of completedRows) {
    const cid = r.lesson.courseId;
    if (!completedByCourse.has(cid)) completedByCourse.set(cid, new Set());
    completedByCourse.get(cid)!.add(r.lessonId);
  }

  const totalByCourse = new Map<string, string[]>();
  for (const l of allLessons) {
    if (!totalByCourse.has(l.courseId)) totalByCourse.set(l.courseId, []);
    totalByCourse.get(l.courseId)!.push(l.id);
  }

  for (const courseId of courseIds) {
    const total = totalByCourse.get(courseId)?.length ?? 0;
    const completedSet = completedByCourse.get(courseId) ?? new Set<string>();
    const completed = completedSet.size;
    map.set(courseId, {
      totalPublished: total,
      completed,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
      completedLessonIds: [...completedSet],
    });
  }

  return map;
}
