import { z } from "zod";

// Safe URL schema — only allow http(s).
export const httpUrlSchema = z
  .string()
  .url()
  .refine((u) => /^https?:\/\//i.test(u), "Must be an http(s) URL");

export const createLessonSchema = z.object({
  courseId: z.string().min(1),
  title: z.string().trim().min(1).max(160),
  contentMd: z.string().max(50_000).default(""),
  videoUrl: httpUrlSchema.optional().nullable(),
  simulatorKey: z.string().min(1).max(60).optional().nullable(),
  // Arbitrary JSON shape; the adapter validates its own config.
  simulatorConfig: z.unknown().optional().nullable(),
});
export type CreateLessonInput = z.infer<typeof createLessonSchema>;

export const updateLessonSchema = z.object({
  title: z.string().trim().min(1).max(160).optional(),
  contentMd: z.string().max(50_000).optional(),
  videoUrl: httpUrlSchema.optional().nullable(),
  simulatorKey: z.string().min(1).max(60).optional().nullable(),
  simulatorConfig: z.unknown().optional().nullable(),
});
export type UpdateLessonInput = z.infer<typeof updateLessonSchema>;

export const reorderLessonsSchema = z.object({
  courseId: z.string().min(1),
  // Ordered array of lesson ids in their new order. Service validates they all
  // belong to the course and covers the full set.
  lessonIds: z.array(z.string().min(1)).min(1),
});
export type ReorderLessonsInput = z.infer<typeof reorderLessonsSchema>;
