import { z } from "zod";

export const createInvitationSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase().trim(),
  role: z.enum(["INSTRUCTOR", "STUDENT"], {
    errorMap: () => ({ message: "Role must be INSTRUCTOR or STUDENT" }),
  }),
});

export const acceptInvitationSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100).trim(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must not exceed 72 characters"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const bulkInviteRowSchema = z.object({
  email: z.string().email("Invalid email"),
  role: z.enum(["INSTRUCTOR", "STUDENT"]),
});

export const bulkInviteSchema = z.object({
  rows: z
    .array(bulkInviteRowSchema)
    .min(1, "At least one row required")
    .max(200, "Maximum 200 rows per bulk import"),
});

export type CreateInvitationInput = z.infer<typeof createInvitationSchema>;
export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;
export type BulkInviteInput = z.infer<typeof bulkInviteSchema>;
