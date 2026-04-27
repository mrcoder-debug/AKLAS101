import { z } from "zod";

export const optionInputSchema = z.object({
  id: z.string().optional(),
  text: z.string().trim().min(1).max(500),
  isCorrect: z.boolean(),
});

export const questionInputSchema = z.object({
  id: z.string().optional(),
  text: z.string().trim().min(1).max(2000),
  explanation: z.string().trim().max(2000).optional().nullable(),
  options: z
    .array(optionInputSchema)
    .min(2, "A question needs at least 2 options")
    .max(10, "Too many options")
    .refine(
      (options) => options.filter((o) => o.isCorrect).length === 1,
      "Exactly one correct option is required",
    ),
});

export const upsertQuizSchema = z.object({
  lessonId: z.string().min(1),
  title: z.string().trim().min(1).max(160),
  passingScore: z.number().int().min(0).max(100).default(70),
  questions: z.array(questionInputSchema).min(1, "At least one question"),
});
export type UpsertQuizInput = z.infer<typeof upsertQuizSchema>;

// Submissions: { questionId: optionId }
export const attemptAnswersSchema = z
  .record(z.string().min(1), z.string().min(1))
  .default({});
export type AttemptAnswers = z.infer<typeof attemptAnswersSchema>;

export const autosaveAttemptSchema = z.object({
  attemptId: z.string().min(1),
  answers: attemptAnswersSchema,
});

export const submitAttemptSchema = z.object({
  attemptId: z.string().min(1),
  answers: attemptAnswersSchema,
});
