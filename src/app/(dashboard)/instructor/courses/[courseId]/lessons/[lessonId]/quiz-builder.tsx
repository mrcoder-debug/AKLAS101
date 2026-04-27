"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { upsertQuizSchema, type UpsertQuizInput } from "@/schemas/quiz.schema";
import { upsertQuizAction } from "@/server/actions/quizzes.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus, Trash2, CheckCircle2, Circle } from "lucide-react";
import type { AuthorQuizDTO } from "@/services/dto";

interface QuizBuilderProps {
  lessonId: string;
  quiz: AuthorQuizDTO | null;
}

const defaultQuestion = () => ({
  text: "",
  explanation: "",
  options: [
    { text: "", isCorrect: true },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
  ],
});

export function QuizBuilder({ lessonId, quiz }: QuizBuilderProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<UpsertQuizInput>({
    resolver: zodResolver(upsertQuizSchema),
    defaultValues: quiz
      ? {
          lessonId,
          title: quiz.title,
          passingScore: quiz.passingScore,
          questions: quiz.questions.map((q) => ({
            id: q.id,
            text: q.text,
            explanation: q.explanation ?? "",
            options: q.options.map((o) => ({ id: o.id, text: o.text, isCorrect: o.isCorrect })),
          })),
        }
      : {
          lessonId,
          title: "Quiz",
          passingScore: 70,
          questions: [defaultQuestion()],
        },
  });

  const { fields: questionFields, append, remove } = useFieldArray({ control, name: "questions" });

  function setCorrect(qIdx: number, oIdx: number) {
    const options = watch(`questions.${qIdx}.options`);
    options.forEach((_, i) =>
      setValue(`questions.${qIdx}.options.${i}.isCorrect`, i === oIdx),
    );
  }

  function onSubmit(data: UpsertQuizInput) {
    startTransition(async () => {
      const result = await upsertQuizAction(data);
      if (result.ok) {
        toast.success("Quiz saved");
        router.refresh();
      } else {
        toast.error(result.error.message);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <input type="hidden" {...register("lessonId")} value={lessonId} />

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="quiz-title">Quiz title</Label>
          <Input id="quiz-title" {...register("title")} />
          {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="passingScore">Passing score (%)</Label>
          <Input
            id="passingScore"
            type="number"
            min={0}
            max={100}
            {...register("passingScore", { valueAsNumber: true })}
          />
        </div>
      </div>

      <div className="space-y-4">
        {questionFields.map((qField, qIdx) => {
          const optionFields = watch(`questions.${qIdx}.options`) ?? [];
          return (
            <Card key={qField.id}>
              <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
                <CardTitle className="text-sm">Question {qIdx + 1}</CardTitle>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => remove(qIdx)}
                  disabled={questionFields.length === 1}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-3 px-4 pb-4">
                <Textarea
                  placeholder="Question text…"
                  {...register(`questions.${qIdx}.text`)}
                  rows={2}
                />
                {errors.questions?.[qIdx]?.text && (
                  <p className="text-xs text-destructive">{errors.questions[qIdx]?.text?.message}</p>
                )}

                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Options — click circle to mark correct</p>
                  {optionFields.map((opt, oIdx) => (
                    <div key={oIdx} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setCorrect(qIdx, oIdx)}
                        className="shrink-0 text-muted-foreground hover:text-primary"
                        aria-label="Mark as correct"
                      >
                        {watch(`questions.${qIdx}.options.${oIdx}.isCorrect`) ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <Circle className="h-4 w-4" />
                        )}
                      </button>
                      <input
                        type="hidden"
                        {...register(`questions.${qIdx}.options.${oIdx}.isCorrect`)}
                      />
                      <Input
                        placeholder={`Option ${oIdx + 1}`}
                        {...register(`questions.${qIdx}.options.${oIdx}.text`)}
                        className="flex-1"
                      />
                    </div>
                  ))}
                  {errors.questions?.[qIdx]?.options?.message && (
                    <p className="text-xs text-destructive">
                      {errors.questions[qIdx]?.options?.message}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append(defaultQuestion())}
        >
          <Plus className="mr-1 h-4 w-4" />
          Add question
        </Button>
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save quiz
        </Button>
      </div>
    </form>
  );
}
