import type { z } from "zod";
import { NotFoundError, ValidationError } from "./errors";

export function parse<T extends z.ZodTypeAny>(schema: T, value: unknown): z.infer<T> {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new ValidationError("Invalid input", result.error.flatten());
  }
  return result.data;
}

// Maps Prisma "record not found" errors (P2025) to our domain NotFoundError.
export function throwIfNotFound(resource: string) {
  return (err: unknown): never => {
    if (
      typeof err === "object" && err !== null && "code" in err &&
      (err as { code?: string }).code === "P2025"
    ) {
      throw new NotFoundError(resource);
    }
    throw err;
  };
}

// Maps Prisma unique-constraint errors (P2002) to a friendly conflict message.
export function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" && err !== null && "code" in err &&
    (err as { code?: string }).code === "P2002"
  );
}
