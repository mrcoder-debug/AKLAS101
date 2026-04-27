import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import {
  createCourseSchema,
  listCoursesSchema,
  updateCourseSchema,
} from "@/schemas/course.schema";
import type { Paginated } from "@/schemas/common.schema";
import { assertCan } from "./authorization";
import type { ServiceContext } from "./context";
import { requireActor } from "./context";
import { ConflictError, NotFoundError } from "./errors";
import { toCourseDTO, type CourseDTO } from "./dto";
import { isUniqueViolation, parse, throwIfNotFound } from "./_util";

export async function listCourses(
  ctx: ServiceContext,
  rawInput: unknown,
): Promise<Paginated<CourseDTO>> {
  const actor = requireActor(ctx);
  assertCan(actor, { action: "course:list" });
  const input = parse(listCoursesSchema, rawInput);

  // Scope by role.
  const where: Prisma.CourseWhereInput = {
    deletedAt: null,
    ...(actor.role === "INSTRUCTOR" ? { instructorId: actor.id } : {}),
    ...(actor.role === "STUDENT"
      ? {
          isPublished: true,
          enrollments: { some: { userId: actor.id, status: "ACTIVE" } },
        }
      : {}),
    ...(input.filters?.published !== undefined
      ? { isPublished: input.filters.published }
      : {}),
    ...(input.filters?.instructorId
      ? { instructorId: input.filters.instructorId }
      : {}),
    ...(input.q
      ? {
          OR: [
            { title: { contains: input.q, mode: "insensitive" } },
            { slug: { contains: input.q, mode: "insensitive" } },
            { description: { contains: input.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const orderBy: Prisma.CourseOrderByWithRelationInput = input.sort
    ? { [input.sort]: input.order ?? "desc" }
    : { createdAt: "desc" };

  const [rows, total] = await prisma.$transaction([
    prisma.course.findMany({
      where,
      orderBy,
      skip: (input.page - 1) * input.pageSize,
      take: input.pageSize,
    }),
    prisma.course.count({ where }),
  ]);

  return {
    rows: rows.map(toCourseDTO),
    total,
    page: input.page,
    pageSize: input.pageSize,
    totalPages: Math.ceil(total / input.pageSize),
  };
}

export async function getCourseById(
  ctx: ServiceContext,
  id: string,
): Promise<CourseDTO> {
  const actor = requireActor(ctx);
  const course = await prisma.course.findFirst({ where: { id, deletedAt: null } });
  if (!course) throw new NotFoundError("Course");

  let enrollment = null as null | { id: string; userId: string; courseId: string; status: "ACTIVE" | "REVOKED" };
  if (actor.role === "STUDENT") {
    const e = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: actor.id, courseId: id } },
    });
    enrollment = e ? { id: e.id, userId: e.userId, courseId: e.courseId, status: e.status } : null;
  }

  assertCan(actor, {
    action: "course:read",
    resource: { id: course.id, instructorId: course.instructorId },
    enrollment,
  });
  return toCourseDTO(course);
}

export async function getCourseBySlug(
  ctx: ServiceContext,
  slug: string,
): Promise<CourseDTO> {
  const course = await prisma.course.findFirst({ where: { slug, deletedAt: null } });
  if (!course) throw new NotFoundError("Course");
  return getCourseById(ctx, course.id);
}

export async function createCourse(
  ctx: ServiceContext,
  rawInput: unknown,
): Promise<CourseDTO> {
  const actor = requireActor(ctx);
  assertCan(actor, { action: "course:create" });
  const input = parse(createCourseSchema, rawInput);

  // Instructors cannot assign a course to someone else.
  const instructorId =
    actor.role === "ADMIN" ? input.instructorId : actor.id;

  try {
    const created = await prisma.course.create({
      data: {
        slug: input.slug,
        title: input.title,
        description: input.description,
        instructorId,
      },
    });
    return toCourseDTO(created);
  } catch (e) {
    if (isUniqueViolation(e)) throw new ConflictError("Slug is already taken");
    throw e;
  }
}

export async function updateCourse(
  ctx: ServiceContext,
  id: string,
  rawInput: unknown,
): Promise<CourseDTO> {
  const actor = requireActor(ctx);
  const course = await prisma.course.findFirst({ where: { id, deletedAt: null } });
  if (!course) throw new NotFoundError("Course");
  assertCan(actor, {
    action: "course:update",
    resource: { id: course.id, instructorId: course.instructorId },
  });
  const input = parse(updateCourseSchema, rawInput);

  // Only admins may reassign a course.
  if (input.instructorId !== undefined && actor.role !== "ADMIN") {
    delete input.instructorId;
  }

  const updated = await prisma.course
    .update({ where: { id }, data: input })
    .catch(throwIfNotFound("Course"));
  return toCourseDTO(updated);
}

export async function setCoursePublished(
  ctx: ServiceContext,
  id: string,
  isPublished: boolean,
): Promise<CourseDTO> {
  const actor = requireActor(ctx);
  const course = await prisma.course.findFirst({ where: { id, deletedAt: null } });
  if (!course) throw new NotFoundError("Course");
  assertCan(actor, {
    action: "course:publish",
    resource: { id: course.id, instructorId: course.instructorId },
  });
  const updated = await prisma.course.update({ where: { id }, data: { isPublished } });
  return toCourseDTO(updated);
}

export async function softDeleteCourse(
  ctx: ServiceContext,
  id: string,
): Promise<void> {
  const actor = requireActor(ctx);
  const course = await prisma.course.findFirst({ where: { id, deletedAt: null } });
  if (!course) throw new NotFoundError("Course");
  assertCan(actor, {
    action: "course:delete",
    resource: { id: course.id, instructorId: course.instructorId },
  });
  await prisma.course.update({
    where: { id },
    data: { deletedAt: new Date(), isPublished: false },
  });
}
