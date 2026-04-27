"use client";

import { useState, useTransition, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, ChevronLeft, ChevronRight, BookOpen, Monitor, HelpCircle, StickyNote, Layers } from "lucide-react";
import { markLessonCompleteAction } from "@/server/actions/progress.actions";
import { startAttemptAction, submitAttemptAction } from "@/server/actions/quizzes.actions";
import { SimulatorHost } from "@/simulator/sim-host";
import { NotesPanel } from "@/components/lesson/notes-panel";
import { FlashcardViewer } from "@/components/lesson/flashcard-viewer";
import { AiTutorChat } from "@/components/ai/ai-tutor-chat";
import type { CourseDTO, LessonDTO, QuizDTO, AttemptDTO, FlashcardDTO } from "@/services/dto";

interface LessonViewerProps {
  course: CourseDTO;
  lesson: LessonDTO;
  allLessons: LessonDTO[];
  quiz: QuizDTO | null;
  openAttempt: AttemptDTO | null;
  completedLessonIds: string[];
  slug: string;
  flashcards: FlashcardDTO[];
}

export function LessonViewer({
  course,
  lesson,
  allLessons,
  quiz,
  openAttempt: initialOpenAttempt,
  completedLessonIds,
  slug,
  flashcards,
}: LessonViewerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isComplete, setIsComplete] = useState(completedLessonIds.includes(lesson.id));
  const [openAttempt, setOpenAttempt] = useState(initialOpenAttempt);
  const [answers, setAnswers] = useState<Record<string, string>>(
    initialOpenAttempt?.answers ?? {},
  );
  const [submittedAttempt, setSubmittedAttempt] = useState<AttemptDTO | null>(null);
  const autosaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sortedLessons = [...allLessons].sort((a, b) => a.order - b.order);
  const currentIdx = sortedLessons.findIndex((l) => l.id === lesson.id);
  const prevLesson = currentIdx > 0 ? sortedLessons[currentIdx - 1] : null;
  const nextLesson = currentIdx < sortedLessons.length - 1 ? sortedLessons[currentIdx + 1] : null;

  const completedSet = new Set(completedLessonIds);
  const hasFlashcards = flashcards.length > 0;

  function handleMarkComplete() {
    startTransition(async () => {
      const result = await markLessonCompleteAction(lesson.id);
      if (result.ok) {
        setIsComplete(true);
        if (result.data.certificateIssued) {
          toast.success("Certificate earned!", {
            description: "You've completed the entire course. Well done!",
            action: { label: "View", onClick: () => router.push("/student/certificates") },
          });
        } else {
          toast.success("Lesson marked complete!");
        }
        router.refresh();
      } else {
        toast.error(result.error.message);
      }
    });
  }

  function handleAnswerChange(questionId: string, optionId: string) {
    const updated = { ...answers, [questionId]: optionId };
    setAnswers(updated);
    scheduleAutosave(updated);
  }

  const scheduleAutosave = useCallback(
    (currentAnswers: Record<string, string>) => {
      if (!openAttempt) return;
      if (autosaveRef.current) clearTimeout(autosaveRef.current);
      autosaveRef.current = setTimeout(async () => {
        await fetch(`/api/v1/attempts/${openAttempt.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers: currentAnswers }),
        });
      }, 1500);
    },
    [openAttempt],
  );

  function handleStartQuiz() {
    if (!quiz) return;
    startTransition(async () => {
      const result = await startAttemptAction(quiz.id);
      if (result.ok) {
        setOpenAttempt(result.data);
        setAnswers(result.data.answers);
      } else {
        toast.error(result.error.message);
      }
    });
  }

  function handleSubmitQuiz() {
    if (!openAttempt) return;
    startTransition(async () => {
      const result = await submitAttemptAction(openAttempt.id, answers);
      if (result.ok) {
        setSubmittedAttempt(result.data);
        setOpenAttempt(null);
        toast[result.data.passed ? "success" : "error"](
          result.data.passed
            ? `Passed! Score: ${result.data.score}%`
            : `Failed — score: ${result.data.score}%. Try again.`,
        );
      } else {
        toast.error(result.error.message);
      }
    });
  }

  return (
    <div className="flex h-full gap-0">
      {/* Lesson sidebar */}
      <aside className="w-56 shrink-0 border-r overflow-y-auto hidden lg:block">
        <div className="p-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">
            {course.title}
          </p>
          <nav className="space-y-0.5">
            {sortedLessons.map((l) => (
              <Link
                key={l.id}
                href={`/student/courses/${slug}/lessons/${l.id}`}
                className={`flex items-center gap-2 rounded px-2 py-1.5 text-xs transition-colors ${
                  l.id === lesson.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                <span className="shrink-0 w-4 text-right font-mono">{l.order}.</span>
                <span className="flex-1 truncate">{l.title}</span>
                {completedSet.has(l.id) && (
                  <CheckCircle2 className="h-3 w-3 shrink-0 text-green-500" />
                )}
              </Link>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">{lesson.title}</h1>
          {isComplete ? (
            <Badge variant="success" className="gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Complete
            </Badge>
          ) : (
            <Button size="sm" variant="outline" onClick={handleMarkComplete} disabled={isPending}>
              Mark complete
            </Button>
          )}
        </div>

        <Tabs defaultValue="lesson" className="space-y-4">
          <TabsList>
            <TabsTrigger value="lesson">
              <BookOpen className="mr-1.5 h-3.5 w-3.5" />
              Lesson
            </TabsTrigger>
            {lesson.simulatorKey && (
              <TabsTrigger value="simulator">
                <Monitor className="mr-1.5 h-3.5 w-3.5" />
                Simulator
              </TabsTrigger>
            )}
            {quiz && (
              <TabsTrigger value="quiz">
                <HelpCircle className="mr-1.5 h-3.5 w-3.5" />
                Quiz
              </TabsTrigger>
            )}
            <TabsTrigger value="notes">
              <StickyNote className="mr-1.5 h-3.5 w-3.5" />
              Notes
            </TabsTrigger>
            {hasFlashcards && (
              <TabsTrigger value="flashcards">
                <Layers className="mr-1.5 h-3.5 w-3.5" />
                Flashcards
              </TabsTrigger>
            )}
          </TabsList>

          {/* Lesson tab */}
          <TabsContent value="lesson" className="space-y-4">
            {lesson.videoUrl && (
              <div className="aspect-video w-full max-w-2xl overflow-hidden rounded-lg border bg-black">
                <iframe
                  src={lesson.videoUrl}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title="Lesson video"
                />
              </div>
            )}
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {lesson.contentMd || "_No content yet._"}
              </ReactMarkdown>
            </div>
          </TabsContent>

          {/* Simulator tab */}
          {lesson.simulatorKey && (
            <TabsContent value="simulator">
              <SimulatorHost
                simulatorKey={lesson.simulatorKey}
                simulatorConfig={lesson.simulatorConfig}
              />
            </TabsContent>
          )}

          {/* Quiz tab */}
          {quiz && (
            <TabsContent value="quiz" className="space-y-4">
              {submittedAttempt ? (
                <div className="space-y-4">
                  <div className={`rounded-lg border p-4 ${submittedAttempt.passed ? "border-green-300 bg-green-50" : "border-red-300 bg-red-50"}`}>
                    <p className="font-semibold">
                      {submittedAttempt.passed ? "Passed!" : "Not quite — try again"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Score: {submittedAttempt.score}% (passing: {quiz.passingScore}%)
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSubmittedAttempt(null);
                      setAnswers({});
                    }}
                  >
                    Try again
                  </Button>
                </div>
              ) : !openAttempt ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {quiz.questions.length} question{quiz.questions.length !== 1 ? "s" : ""} —
                    passing score {quiz.passingScore}%
                  </p>
                  <Button size="sm" onClick={handleStartQuiz} disabled={isPending}>
                    Start quiz
                  </Button>
                </div>
              ) : (
                <div className="space-y-6 max-w-2xl">
                  {quiz.questions.map((question, qi) => (
                    <div key={question.id} className="space-y-3">
                      <p className="font-medium text-sm">
                        {qi + 1}. {question.text}
                      </p>
                      <div className="space-y-2">
                        {question.options.map((option) => {
                          const selected = answers[question.id] === option.id;
                          return (
                            <label
                              key={option.id}
                              className={`flex cursor-pointer items-center gap-3 rounded-md border p-3 text-sm transition-colors ${
                                selected
                                  ? "border-primary bg-primary/5"
                                  : "border-border hover:bg-accent"
                              }`}
                            >
                              <input
                                type="radio"
                                name={question.id}
                                value={option.id}
                                checked={selected}
                                onChange={() => handleAnswerChange(question.id, option.id)}
                                className="accent-primary"
                              />
                              {option.text}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  <Button
                    onClick={handleSubmitQuiz}
                    disabled={
                      isPending ||
                      Object.keys(answers).length < quiz.questions.length
                    }
                  >
                    Submit quiz
                  </Button>
                </div>
              )}
            </TabsContent>
          )}

          {/* Notes tab */}
          <TabsContent value="notes">
            <NotesPanel lessonId={lesson.id} />
          </TabsContent>

          {/* Flashcards tab */}
          {hasFlashcards && (
            <TabsContent value="flashcards">
              <FlashcardViewer lessonId={lesson.id} initialFlashcards={flashcards} />
            </TabsContent>
          )}
        </Tabs>

        {/* Prev/Next navigation */}
        <div className="flex justify-between pt-4 border-t">
          {prevLesson ? (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/student/courses/${slug}/lessons/${prevLesson.id}`}>
                <ChevronLeft className="mr-1 h-4 w-4" />
                {prevLesson.title}
              </Link>
            </Button>
          ) : <div />}
          {nextLesson ? (
            <Button size="sm" asChild>
              <Link href={`/student/courses/${slug}/lessons/${nextLesson.id}`}>
                {nextLesson.title}
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          ) : <div />}
        </div>
      </div>

      {/* AI Tutor Chat — floating overlay */}
      <AiTutorChat courseId={course.id} />
    </div>
  );
}
