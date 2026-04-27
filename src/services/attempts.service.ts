// Quiz attempt lifecycle: start → autosave → submit.
// The submit path uses a raw SQL SELECT FOR UPDATE to prevent concurrent
// double-submissions; the partial unique index on (userId, quizId) WHERE
// submittedAt IS NULL prevents starting two concurrent in-flight attempts.

import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { attemptAnswersSchema } from "@/schemas/quiz.schema";
import { assertCan } from "./authorization";
import type { ServiceContext } from "./context";
import { requireActor } from "./context";
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from "./errors";
import { toAttemptDTO, type AttemptDTO } from "./dto";
import { parse } from "./_util";
import { awardXP } from "./gamification.service";

const startAttemptSchema = z.object({ quizId: z.string().min(1) });
const autosaveSchema = z.object({
  attemptId: z.string().min(1),
  answers: attemptAnswersSchema,
});
const submitSchema = z.object({
  attemptId: z.string().min(1),
  answers: attemptAnswersSchema,
});

async function getActiveEnrollment(userId: string, courseId: string) {
  return prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });
}

export async function startAttempt(
  ctx: ServiceContext,
  rawInput: unknown,
): Promise<AttemptDTO> {
  const actor = requireActor(ctx);
  const { quizId } = parse(startAttemptSchema, rawInput);

  const quiz = await prisma.quiz.findFirst({
    where: { id: quizId, deletedAt: null },
    include: { lesson: { select: { courseId: true } } },
  });
  if (!quiz) throw new NotFoundError("Quiz");

  const courseId = quiz.lesson.courseId;
  const course = await prisma.course.findFirst({ where: { id: courseId, deletedAt: null } });
  if (!course) throw new NotFoundError("Course");

  const e = await getActiveEnrollment(actor.id, courseId);
  assertCan(actor, {
    action: "quiz:startAttempt",
    resource: {
      course: { id: course.id, instructorId: course.instructorId },
      enrollment: e ? { id: e.id, userId: e.userId, courseId: e.courseId, status: e.status } : null,
    },
  });

  // The partial unique index will reject a duplicate open attempt; catch P2002.
  try {
    const attempt = await prisma.quizAttempt.create({
      data: { userId: actor.id, quizId, answers: {} },
    });
    return toAttemptDTO(attempt);
  } catch (err) {
    if (
      typeof err === "object" && err !== null && "code" in err &&
      (err as { code?: string }).code === "P2002"
    ) {
      throw new ConflictError("You already have an in-progress attempt for this quiz");
    }
    throw err;
  }
}

export async function autosaveAttempt(
  ctx: ServiceContext,
  rawInput: unknown,
): Promise<AttemptDTO> {
  const actor = requireActor(ctx);
  const { attemptId, answers } = parse(autosaveSchema, rawInput);

  const attempt = await prisma.quizAttempt.findUnique({ where: { id: attemptId } });
  if (!attempt) throw new NotFoundError("Attempt");
  if (attempt.userId !== actor.id) throw new ForbiddenError();
  if (attempt.submittedAt) throw new ValidationError("Attempt already submitted");

  const updated = await prisma.quizAttempt.update({
    where: { id: attemptId },
    data: { answers: answers as object },
  });
  return toAttemptDTO(updated);
}

export async function submitAttempt(
  ctx: ServiceContext,
  rawInput: unknown,
): Promise<AttemptDTO> {
  const actor = requireActor(ctx);
  const { attemptId, answers } = parse(submitSchema, rawInput);

  const result = await prisma.$transaction(async (tx) => {
    // Lock the row for the duration of the transaction.
    const locked = await tx.$queryRaw<Array<{
      id: string;
      userId: string;
      quizId: string;
      submittedAt: Date | null;
    }>>`
      SELECT id, "userId", "quizId", "submittedAt"
      FROM "QuizAttempt"
      WHERE id = ${attemptId}
      FOR UPDATE
    `;

    const attempt = locked[0];
    if (!attempt) throw new NotFoundError("Attempt");
    if (attempt.userId !== actor.id) throw new ForbiddenError();
    if (attempt.submittedAt !== null)
      throw new ConflictError("Attempt already submitted");

    assertCan(actor, {
      action: "quiz:submitAttempt",
      resource: {
        id: attempt.id,
        userId: attempt.userId,
        submittedAt: attempt.submittedAt,
      },
    });

    // Re-score from the canonical question/option rows — never trust client.
    const quiz = await tx.quiz.findFirstOrThrow({
      where: { id: attempt.quizId, deletedAt: null },
      include: {
        questions: { include: { options: { where: { isCorrect: true } } } },
      },
    });

    const totalQuestions = quiz.questions.length;
    let correct = 0;

    for (const question of quiz.questions) {
      const correctOptionId = question.options[0]?.id;
      if (correctOptionId && answers[question.id] === correctOptionId) {
        correct += 1;
      }
    }

    const score =
      totalQuestions > 0 ? Math.round((correct / totalQuestions) * 100) : 0;
    const passed = score >= quiz.passingScore;

    const updated = await tx.quizAttempt.update({
      where: { id: attemptId },
      data: {
        submittedAt: new Date(),
        score,
        passed,
        answers: answers as object,
      },
    });

    if (passed) {
      await awardXP(tx, actor.id, score === 100 ? 50 : 25);
    }

    return updated;
  });

  return toAttemptDTO(result);
}

export async function getAttemptsByUser(
  ctx: ServiceContext,
  userId: string,
  quizId: string,
): Promise<AttemptDTO[]> {
  const actor = requireActor(ctx);

  const quiz = await prisma.quiz.findFirst({
    where: { id: quizId, deletedAt: null },
    include: { lesson: { select: { courseId: true } } },
  });
  if (!quiz) throw new NotFoundError("Quiz");

  const course = await prisma.course.findFirst({
    where: { id: quiz.lesson.courseId, deletedAt: null },
  });
  if (!course) throw new NotFoundError("Course");

  // Students can only see their own attempts.
  if (actor.role === "STUDENT" && actor.id !== userId) throw new ForbiddenError();

  const attempts = await prisma.quizAttempt.findMany({
    where: { userId, quizId },
    orderBy: { startedAt: "desc" },
  });
  return attempts.map(toAttemptDTO);
}

export async function getOpenAttempt(
  ctx: ServiceContext,
  quizId: string,
): Promise<AttemptDTO | null> {
  const actor = requireActor(ctx);
  const attempt = await prisma.quizAttempt.findFirst({
    where: { userId: actor.id, quizId, submittedAt: null },
  });
  return attempt ? toAttemptDTO(attempt) : null;
}
