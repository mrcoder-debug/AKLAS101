import { prisma } from "@/lib/prisma";
import { assertCan } from "./authorization";
import type { ServiceContext } from "./context";
import { requireActor } from "./context";

export interface CourseStats {
  courseId: string;
  title: string;
  enrollmentCount: number;
  completionRate: number;
  quizPassRate: number;
  avgScore: number;
}

export interface InstructorStats {
  totalEnrollments: number;
  totalCourses: number;
  avgCompletionRate: number;
  courses: CourseStats[];
}

export async function getInstructorStats(ctx: ServiceContext): Promise<InstructorStats> {
  const actor = requireActor(ctx);
  assertCan(actor, { action: "course:create" });

  const courses = await prisma.course.findMany({
    where: {
      deletedAt: null,
      ...(actor.role === "INSTRUCTOR" ? { instructorId: actor.id } : {}),
    },
    select: {
      id: true,
      title: true,
      lessons: {
        where: { deletedAt: null, isPublished: true },
        select: { id: true },
      },
      enrollments: {
        where: { status: "ACTIVE" },
        select: { userId: true },
      },
    },
  });

  const courseStats: CourseStats[] = await Promise.all(
    courses.map(async (course) => {
      const enrolledUserIds = course.enrollments.map((e) => e.userId);
      const totalLessons = course.lessons.length;
      const enrollmentCount = enrolledUserIds.length;

      let completionRate = 0;
      if (enrollmentCount > 0 && totalLessons > 0) {
        const lessonIds = course.lessons.map((l) => l.id);
        const progressCounts = await prisma.lessonProgress.groupBy({
          by: ["userId"],
          where: { userId: { in: enrolledUserIds }, lessonId: { in: lessonIds } },
          _count: { lessonId: true },
        });
        const completedUsers = progressCounts.filter(
          (p) => p._count.lessonId >= totalLessons,
        ).length;
        completionRate = Math.round((completedUsers / enrollmentCount) * 100);
      }

      const attempts = await prisma.quizAttempt.findMany({
        where: {
          userId: { in: enrolledUserIds },
          submittedAt: { not: null },
          quiz: { lesson: { courseId: course.id } },
        },
        select: { passed: true, score: true },
      });

      const quizPassRate =
        attempts.length > 0
          ? Math.round((attempts.filter((a) => a.passed).length / attempts.length) * 100)
          : 0;

      const avgScore =
        attempts.length > 0
          ? Math.round(attempts.reduce((s, a) => s + a.score, 0) / attempts.length)
          : 0;

      return {
        courseId: course.id,
        title: course.title,
        enrollmentCount,
        completionRate,
        quizPassRate,
        avgScore,
      };
    }),
  );

  const totalEnrollments = courseStats.reduce((s, c) => s + c.enrollmentCount, 0);
  const avgCompletionRate =
    courseStats.length > 0
      ? Math.round(courseStats.reduce((s, c) => s + c.completionRate, 0) / courseStats.length)
      : 0;

  return {
    totalEnrollments,
    totalCourses: courses.length,
    avgCompletionRate,
    courses: courseStats,
  };
}
