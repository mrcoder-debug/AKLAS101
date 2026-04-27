import { z } from "zod";
import { listParams } from "./common.schema";

export const slugSchema = z
  .string()
  .trim()
  .min(3)
  .max(80)
  .regex(/^[a-z0-9][a-z0-9-]*$/, "Lowercase letters, digits, and dashes only");

export const createCourseSchema = z.object({
  slug: slugSchema,
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().min(1).max(4000),
  instructorId: z.string().min(1),
});
export type CreateCourseInput = z.infer<typeof createCourseSchema>;

export const updateCourseSchema = z.object({
  title: z.string().trim().min(1).max(160).optional(),
  description: z.string().trim().min(1).max(4000).optional(),
  // Admin-only — service checks this.
  instructorId: z.string().min(1).optional(),
});
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;

export const listCoursesSchema = listParams(
  z.enum(["createdAt", "title", "updatedAt"]),
  z.object({
    published: z.boolean().optional(),
    instructorId: z.string().optional(),
  }),
);
export type ListCoursesInput = z.infer<typeof listCoursesSchema>;
