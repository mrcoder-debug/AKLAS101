import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import {
  createLessonSchema,
  reorderLessonsSchema,
  updateLessonSchema,
} from "@/schemas/lesson.schema";
import { assertCan } from "./authorization";
import type { ServiceContext } from "./context";
import { requireActor } from "./context";
import { NotFoundError, ValidationError } from "./errors";
import { toLessonDTO, type LessonDTO } from "./dto";
import { parse } from "./_util";

async function getCourseOrThrow(id: string) {
  const c = await prisma.course.findFirst({ where: { id, deletedAt: null } });
  if (!c) throw new NotFoundError("Course");
  return c;
}

async function getLessonOrThrow(id: string) {
  const l = await prisma.lesson.findFirst({ where: { id, deletedAt: null } });
  if (!l) throw new NotFoundError("Lesson");
  return l;
}

export async function listLessons(
  ctx: ServiceContext,
  courseId: string,
): Promise<LessonDTO[]> {
  const actor = requireActor(ctx);
  const course = await getCourseOrThrow(courseId);

  const isAuthor =
    actor.role === "ADMIN" ||
    (actor.role === "INSTRUCTOR" && course.instructorId === actor.id);

  // Students only see published lessons they have an active enrollment for.
  let publishedOnly = !isAuthor;
  if (actor.role === "STUDENT") {
    const e = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: actor.id, courseId } },
    });
    if (!e || e.status !== "ACTIVE") throw new NotFoundError("Course");
  }

  const lessons = await prisma.lesson.findMany({
    where: {
      courseId,
      deletedAt: null,
      ...(publishedOnly ? { isPublished: true } : {}),
    },
    orderBy: { order: "asc" },
  });

  return lessons.map(toLessonDTO);
}

export async function getLessonById(
  ctx: ServiceContext,
  id: string,
): Promise<LessonDTO> {
  const actor = requireActor(ctx);
  const lesson = await getLessonOrThrow(id);
  const course = await getCourseOrThrow(lesson.courseId);

  let enrollment = null as null | { id: string; userId: string; courseId: string; status: "ACTIVE" | "REVOKED" };
  if (actor.role === "STUDENT") {
    const e = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: actor.id, courseId: lesson.courseId } },
    });
    enrollment = e ? { id: e.id, userId: e.userId, courseId: e.courseId, status: e.status } : null;
  }

  assertCan(actor, {
    action: "lesson:view",
    resource: {
      course: { id: course.id, instructorId: course.instructorId },
      lesson: { id: lesson.id, courseId: lesson.courseId, isPublished: lesson.isPublished },
      enrollment,
    },
  });
  return toLessonDTO(lesson);
}

export async function createLesson(
  ctx: ServiceContext,
  rawInput: unknown,
): Promise<LessonDTO> {
  const actor = requireActor(ctx);
  const input = parse(createLessonSchema, rawInput);
  const course = await getCourseOrThrow(input.courseId);
  assertCan(actor, {
    action: "lesson:create",
    resource: { id: course.id, instructorId: course.instructorId },
  });

  // Append at the end.
  const maxOrder = await prisma.lesson.aggregate({
    _max: { order: true },
    where: { courseId: input.courseId, deletedAt: null },
  });
  const nextOrder = (maxOrder._max.order ?? 0) + 1;

  const created = await prisma.lesson.create({
    data: {
      courseId: input.courseId,
      order: nextOrder,
      title: input.title,
      contentMd: input.contentMd ?? "",
      videoUrl: input.videoUrl ?? null,
      simulatorKey: input.simulatorKey ?? null,
      simulatorConfig: input.simulatorConfig != null
        ? (input.simulatorConfig as Prisma.InputJsonValue)
        : Prisma.JsonNull,
    },
  });
  return toLessonDTO(created);
}

export async function updateLesson(
  ctx: ServiceContext,
  id: string,
  rawInput: unknown,
): Promise<LessonDTO> {
  const actor = requireActor(ctx);
  const lesson = await getLessonOrThrow(id);
  const course = await getCourseOrThrow(lesson.courseId);
  assertCan(actor, {
    action: "lesson:update",
    resource: { course: { id: course.id, instructorId: course.instructorId } },
  });
  const input = parse(updateLessonSchema, rawInput);

  const updated = await prisma.lesson.update({
    where: { id },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.contentMd !== undefined ? { contentMd: input.contentMd } : {}),
      ...("videoUrl" in input ? { videoUrl: input.videoUrl ?? null } : {}),
      ...("simulatorKey" in input ? { simulatorKey: input.simulatorKey ?? null } : {}),
      ...("simulatorConfig" in input
        ? {
            simulatorConfig:
              input.simulatorConfig != null
                ? (input.simulatorConfig as Prisma.InputJsonValue)
                : Prisma.JsonNull,
          }
        : {}),
    },
  });
  return toLessonDTO(updated);
}

export async function setLessonPublished(
  ctx: ServiceContext,
  id: string,
  isPublished: boolean,
): Promise<LessonDTO> {
  const actor = requireActor(ctx);
  const lesson = await getLessonOrThrow(id);
  const course = await getCourseOrThrow(lesson.courseId);
  assertCan(actor, {
    action: "lesson:update",
    resource: { course: { id: course.id, instructorId: course.instructorId } },
  });
  const updated = await prisma.lesson.update({ where: { id }, data: { isPublished } });
  return toLessonDTO(updated);
}

export async function reorderLessons(
  ctx: ServiceContext,
  rawInput: unknown,
): Promise<LessonDTO[]> {
  const actor = requireActor(ctx);
  const input = parse(reorderLessonsSchema, rawInput);
  const course = await getCourseOrThrow(input.courseId);
  assertCan(actor, {
    action: "lesson:update",
    resource: { course: { id: course.id, instructorId: course.instructorId } },
  });

  // Validate that the provided IDs match the actual lessons for this course.
  const existing = await prisma.lesson.findMany({
    where: { courseId: input.courseId, deletedAt: null },
    select: { id: true },
  });
  const existingIds = new Set(existing.map((l) => l.id));
  const inputSet = new Set(input.lessonIds);
  if (inputSet.size !== existingIds.size || ![...inputSet].every((id) => existingIds.has(id))) {
    throw new ValidationError("lessonIds must exactly match the course's current lessons");
  }

  const updated = await prisma.$transaction(
    input.lessonIds.map((lessonId, idx) =>
      prisma.lesson.update({
        where: { id: lessonId },
        data: { order: idx + 1 },
      }),
    ),
  );
  return updated.map(toLessonDTO);
}

export async function softDeleteLesson(
  ctx: ServiceContext,
  id: string,
): Promise<void> {
  const actor = requireActor(ctx);
  const lesson = await getLessonOrThrow(id);
  const course = await getCourseOrThrow(lesson.courseId);
  assertCan(actor, {
    action: "lesson:delete",
    resource: { course: { id: course.id, instructorId: course.instructorId } },
  });
  await prisma.lesson.update({
    where: { id },
    data: { deletedAt: new Date(), isPublished: false },
  });
}
