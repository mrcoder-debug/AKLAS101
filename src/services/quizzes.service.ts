import { prisma } from "@/lib/prisma";
import { upsertQuizSchema } from "@/schemas/quiz.schema";
import { assertCan } from "./authorization";
import type { ServiceContext } from "./context";
import { requireActor } from "./context";
import { NotFoundError, ValidationError } from "./errors";
import {
  toAuthorQuizDTO,
  toStudentQuizDTO,
  type AuthorQuizDTO,
  type QuizDTO,
} from "./dto";
import { parse } from "./_util";

async function getCourseOrThrow(id: string) {
  const c = await prisma.course.findFirst({ where: { id, deletedAt: null } });
  if (!c) throw new NotFoundError("Course");
  return c;
}

async function getQuizWithQuestions(id: string) {
  return prisma.quiz.findFirst({
    where: { id, deletedAt: null },
    include: {
      questions: {
        where: { /* no deleted filter — questions have no deletedAt */ },
        include: { options: true },
        orderBy: { order: "asc" },
      },
    },
  });
}

export async function getQuizByLesson(
  ctx: ServiceContext,
  lessonId: string,
): Promise<QuizDTO | AuthorQuizDTO | null> {
  const actor = requireActor(ctx);

  const lesson = await prisma.lesson.findFirst({
    where: { id: lessonId, deletedAt: null },
  });
  if (!lesson) throw new NotFoundError("Lesson");

  const course = await getCourseOrThrow(lesson.courseId);

  const isAuthor =
    actor.role === "ADMIN" ||
    (actor.role === "INSTRUCTOR" && course.instructorId === actor.id);

  if (!isAuthor) {
    // Students need an active enrollment.
    const e = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: actor.id, courseId: lesson.courseId } },
    });
    assertCan(actor, {
      action: "quiz:view",
      resource: {
        course: { id: course.id, instructorId: course.instructorId },
        enrollment: e ? { id: e.id, userId: e.userId, courseId: e.courseId, status: e.status } : null,
      },
    });
  }

  const quiz = await prisma.quiz.findFirst({
    where: { lessonId, deletedAt: null },
    include: {
      questions: { include: { options: true }, orderBy: { order: "asc" } },
    },
  });
  if (!quiz) return null;

  return isAuthor ? toAuthorQuizDTO(quiz) : toStudentQuizDTO(quiz);
}

// Full replace-and-recreate inside a single transaction to keep the quiz,
// questions, and options consistent. The one-correct-per-question invariant
// is enforced here AND by the Zod schema AND by the partial unique index.
export async function upsertQuiz(
  ctx: ServiceContext,
  rawInput: unknown,
): Promise<AuthorQuizDTO> {
  const actor = requireActor(ctx);
  const input = parse(upsertQuizSchema, rawInput);

  const lesson = await prisma.lesson.findFirst({
    where: { id: input.lessonId, deletedAt: null },
  });
  if (!lesson) throw new NotFoundError("Lesson");

  const course = await getCourseOrThrow(lesson.courseId);
  assertCan(actor, {
    action: "quiz:manage",
    resource: { course: { id: course.id, instructorId: course.instructorId } },
  });

  // Validate one-correct-per-question (belt-and-suspenders: schema already does this).
  for (const q of input.questions) {
    const correctCount = q.options.filter((o) => o.isCorrect).length;
    if (correctCount !== 1) {
      throw new ValidationError(`Question "${q.text}": exactly one correct option is required`);
    }
  }

  const saved = await prisma.$transaction(async (tx) => {
    // Upsert the quiz header.
    const quiz = await tx.quiz.upsert({
      where: { lessonId: input.lessonId },
      create: {
        lessonId: input.lessonId,
        title: input.title,
        passingScore: input.passingScore,
      },
      update: {
        title: input.title,
        passingScore: input.passingScore,
        deletedAt: null,
      },
    });

    // Replace all questions for this quiz.
    await tx.question.deleteMany({ where: { quizId: quiz.id } });

    for (const [qi, q] of input.questions.entries()) {
      const question = await tx.question.create({
        data: {
          quizId: quiz.id,
          order: qi + 1,
          text: q.text,
          explanation: q.explanation ?? null,
        },
      });
      await tx.option.createMany({
        data: q.options.map((o) => ({
          questionId: question.id,
          text: o.text,
          isCorrect: o.isCorrect,
        })),
      });
    }

    return tx.quiz.findUniqueOrThrow({
      where: { id: quiz.id },
      include: {
        questions: { include: { options: true }, orderBy: { order: "asc" } },
      },
    });
  });

  return toAuthorQuizDTO(saved);
}

export async function softDeleteQuiz(
  ctx: ServiceContext,
  lessonId: string,
): Promise<void> {
  const actor = requireActor(ctx);
  const lesson = await prisma.lesson.findFirst({ where: { id: lessonId, deletedAt: null } });
  if (!lesson) throw new NotFoundError("Lesson");
  const course = await getCourseOrThrow(lesson.courseId);
  assertCan(actor, {
    action: "quiz:manage",
    resource: { course: { id: course.id, instructorId: course.instructorId } },
  });

  await prisma.quiz.updateMany({
    where: { lessonId, deletedAt: null },
    data: { deletedAt: new Date() },
  });
}
