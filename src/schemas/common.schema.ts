import { z } from "zod";

export const idSchema = z.string().min(1, "Required");
export const cuidSchema = z.string().regex(/^c[a-z0-9]{20,}$/i, "Invalid id");

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const sortOrderSchema = z.enum(["asc", "desc"]).default("desc");

export function listParams<S extends z.ZodTypeAny, F extends z.ZodTypeAny>(
  sortFields: S,
  filters?: F,
) {
  return z.object({
    page: paginationSchema.shape.page,
    pageSize: paginationSchema.shape.pageSize,
    sort: sortFields.optional(),
    order: sortOrderSchema.optional(),
    q: z.string().trim().max(200).optional(),
    filters: (filters ?? z.any()).optional(),
  });
}

export interface Paginated<T> {
  rows: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
