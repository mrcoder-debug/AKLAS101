import { prisma } from "@/lib/prisma";
import { anthropic } from "@/lib/anthropic";
import { assertCan } from "./authorization";
import { NotFoundError } from "./errors";
import type { Actor } from "./authorization";

const MODEL = "claude-haiku-4-5-20251001";

async function getLessonWithCourse(lessonId: string) {
  const lesson = await prisma.lesson.findFirst({
    where: { id: lessonId, deletedAt: null },
    include: { course: { select: { id: true, instructorId: true } } },
  });
  if (!lesson) throw new NotFoundError("Lesson");
  return lesson;
}

export async function generateSummary(ctx: { actor: Actor }, lessonId: string) {
  const lesson = await getLessonWithCourse(lessonId);
  assertCan(ctx.actor, { action: "ai:generateContent", resource: lesson.course });

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Summarize the following lesson content in 3-5 concise bullet points for students. Focus on key concepts and takeaways.\n\n# ${lesson.title}\n\n${lesson.contentMd}`,
      },
    ],
  });

  const firstBlock = response.content[0];
  const content = firstBlock?.type === "text" ? firstBlock.text : "";

  return prisma.lessonSummary.upsert({
    where: { lessonId },
    update: { content, model: response.model, generatedAt: new Date(), updatedAt: new Date() },
    create: { lessonId, content, model: response.model },
  });
}

export async function getSummary(lessonId: string) {
  return prisma.lessonSummary.findUnique({ where: { lessonId } });
}

export async function generateFlashcards(ctx: { actor: Actor }, lessonId: string) {
  const lesson = await getLessonWithCourse(lessonId);
  assertCan(ctx.actor, { action: "ai:generateContent", resource: lesson.course });

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `Generate 5-8 flashcards for the following lesson. Return ONLY a JSON array with objects having "front" (question/term) and "back" (answer/definition) string fields. No other text.\n\n# ${lesson.title}\n\n${lesson.contentMd}`,
      },
    ],
  });

  const firstBlock2 = response.content[0];
  const text = firstBlock2?.type === "text" ? firstBlock2.text.trim() : "[]";
  let cards: { front: string; back: string }[] = [];
  try {
    // Strip markdown code fences if present
    const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    cards = JSON.parse(cleaned);
    if (!Array.isArray(cards)) cards = [];
  } catch {
    cards = [];
  }

  await prisma.flashcard.deleteMany({ where: { lessonId } });
  if (cards.length > 0) {
    await prisma.flashcard.createMany({
      data: cards.map((c, i) => ({
        lessonId,
        front: c.front ?? "",
        back: c.back ?? "",
        order: i + 1,
      })),
    });
  }

  return prisma.flashcard.findMany({ where: { lessonId }, orderBy: { order: "asc" } });
}

export async function getFlashcards(lessonId: string) {
  return prisma.flashcard.findMany({ where: { lessonId }, orderBy: { order: "asc" } });
}
