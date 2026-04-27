import { notFound } from "next/navigation";
import { requireRole, toActor } from "@/server/auth/session";
import { getLessonById, listLessons } from "@/services/lessons.service";
import { getCourseBySlug } from "@/services/courses.service";
import { getQuizByLesson } from "@/services/quizzes.service";
import { getOpenAttempt } from "@/services/attempts.service";
import { getCourseProgress } from "@/services/progress.service";
import { getFlashcards } from "@/services/ai-summaries.service";
import { isAppError } from "@/services/errors";
import { LessonViewer } from "./lesson-viewer";
import type { QuizDTO } from "@/services/dto";

export default async function StudentLessonPage({
  params,
}: {
  params: Promise<{ slug: string; lessonId: string }>;
}) {
  const { slug, lessonId } = await params;
  const user = await requireRole(["STUDENT"]);
  const ctx = { actor: toActor(user) };

  let course;
  try {
    course = await getCourseBySlug(ctx, slug);
  } catch (e) {
    if (isAppError(e) && (e.status === 404 || e.status === 403)) notFound();
    throw e;
  }

  let lesson;
  try {
    lesson = await getLessonById(ctx, lessonId);
  } catch (e) {
    if (isAppError(e) && (e.status === 404 || e.status === 403)) notFound();
    throw e;
  }

  const quizRaw = await getQuizByLesson(ctx, lessonId);
  const quiz = quizRaw as QuizDTO | null;

  const [allLessons, openAttempt, progress, flashcards] = await Promise.all([
    listLessons(ctx, course.id),
    quiz ? getOpenAttempt(ctx, quiz.id) : Promise.resolve(null),
    getCourseProgress(ctx, course.id),
    getFlashcards(lessonId),
  ]);

  const completedSet = new Set(progress.completedLessonIds);

  return (
    <LessonViewer
      course={course}
      lesson={lesson}
      allLessons={allLessons}
      quiz={quiz}
      openAttempt={openAttempt}
      completedLessonIds={[...completedSet]}
      slug={slug}
      flashcards={flashcards}
    />
  );
}
