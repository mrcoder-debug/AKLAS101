import { notFound } from "next/navigation";
import { requireRole, toActor } from "@/server/auth/session";
import { getLessonById } from "@/services/lessons.service";
import { getQuizByLesson } from "@/services/quizzes.service";
import { isAppError } from "@/services/errors";
import { LessonEditor } from "./lesson-editor";
import { QuizBuilder } from "./quiz-builder";
import { Separator } from "@/components/ui/separator";
import type { AuthorQuizDTO } from "@/services/dto";

export default async function LessonEditorPage({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>;
}) {
  const { courseId, lessonId } = await params;
  const user = await requireRole(["ADMIN", "INSTRUCTOR"]);
  const ctx = { actor: toActor(user) };

  let lesson;
  try {
    lesson = await getLessonById(ctx, lessonId);
  } catch (e) {
    if (isAppError(e) && (e.status === 404 || e.status === 403)) notFound();
    throw e;
  }

  const quiz = (await getQuizByLesson(ctx, lessonId)) as AuthorQuizDTO | null;

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold">Edit Lesson</h1>
        <p className="text-sm text-muted-foreground">Lesson {lesson.order}: {lesson.title}</p>
      </div>

      <LessonEditor lesson={lesson} />

      <Separator />

      <div>
        <h2 className="text-lg font-semibold mb-4">Quiz</h2>
        <QuizBuilder lessonId={lessonId} quiz={quiz} />
      </div>
    </div>
  );
}
