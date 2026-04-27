import { prisma } from "@/lib/prisma";
import { assertCan } from "./authorization";
import { NotFoundError } from "./errors";
import type { Actor } from "./authorization";

export async function getOrCreateConversation(ctx: { actor: Actor }, courseId: string) {
  const course = await prisma.course.findFirst({
    where: { id: courseId, deletedAt: null },
    select: { id: true, instructorId: true },
  });
  if (!course) throw new NotFoundError("Course");

  const enrollment =
    ctx.actor.role === "STUDENT"
      ? await prisma.enrollment.findFirst({
          where: { userId: ctx.actor.id, courseId, status: "ACTIVE" },
        })
      : null;

  assertCan(ctx.actor, { action: "ai:chat", resource: { course, enrollment } });

  const existing = await prisma.aIConversation.findFirst({
    where: { userId: ctx.actor.id, courseId },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  if (existing) return existing;

  return prisma.aIConversation.create({
    data: { userId: ctx.actor.id, courseId },
    include: { messages: true },
  });
}

export async function buildCourseContext(courseId: string): Promise<string> {
  const lessons = await prisma.lesson.findMany({
    where: { courseId, isPublished: true, deletedAt: null },
    orderBy: { order: "asc" },
    select: { title: true, contentMd: true, order: true },
  });
  return lessons
    .map((l) => `## Lesson ${l.order}: ${l.title}\n\n${l.contentMd}`)
    .join("\n\n---\n\n");
}

export async function appendMessages(
  conversationId: string,
  messages: { role: string; content: string }[],
) {
  return prisma.aIMessage.createMany({
    data: messages.map((m) => ({ conversationId, role: m.role, content: m.content })),
  });
}
