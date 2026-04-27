import { z } from "zod";
import { passwordSchema } from "./auth.schema";
import { listParams } from "./common.schema";

export const roleSchema = z.enum(["ADMIN", "INSTRUCTOR", "STUDENT"]);
export type RoleInput = z.infer<typeof roleSchema>;

export const createUserSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  name: z.string().trim().min(1).max(120),
  role: roleSchema,
  password: passwordSchema,
});
export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  email: z.string().trim().toLowerCase().email().optional(),
});
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export const changeRoleSchema = z.object({ role: roleSchema });
export const setActiveSchema = z.object({ isActive: z.boolean() });
export const resetPasswordSchema = z.object({ password: passwordSchema });

export const listUsersSchema = listParams(
  z.enum(["createdAt", "name", "email", "role"]),
  z.object({
    role: roleSchema.optional(),
    isActive: z.boolean().optional(),
  }),
);
export type ListUsersInput = z.infer<typeof listUsersSchema>;

export const updateProfileSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  avatarUrl: z.string().url().max(500).nullish(),
  bio: z.string().trim().max(500).nullish(),
  linkedinUrl: z.string().url().max(300).nullish(),
  twitterUrl: z.string().url().max(300).nullish(),
  githubUrl: z.string().url().max(300).nullish(),
});
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: passwordSchema,
});
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
