import { prisma } from "@/lib/prisma";
import { assertCan } from "./authorization";
import type { ServiceContext } from "./context";
import { requireActor } from "./context";
import { toAuditLogDTO, type AuditLogDTO } from "./dto";
import { parse } from "./_util";
import type { Paginated } from "@/schemas/common.schema";
import { z } from "zod";
import type { AuditAction } from "@prisma/client";

const listAuditLogsSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(25),
  actorId: z.string().optional(),
  action: z.string().optional(),
  targetType: z.string().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export async function listAuditLogs(
  ctx: ServiceContext,
  rawInput: unknown,
): Promise<Paginated<AuditLogDTO>> {
  const actor = requireActor(ctx);
  assertCan(actor, { action: "auditLog:list" });
  const input = parse(listAuditLogsSchema, rawInput);

  const where = {
    ...(input.actorId ? { actorId: input.actorId } : {}),
    ...(input.action ? { action: input.action as AuditAction } : {}),
    ...(input.targetType ? { targetType: input.targetType } : {}),
    ...(input.from || input.to
      ? {
          createdAt: {
            ...(input.from ? { gte: input.from } : {}),
            ...(input.to ? { lte: input.to } : {}),
          },
        }
      : {}),
  };

  const [rows, total] = await prisma.$transaction([
    prisma.auditLog.findMany({
      where,
      include: { actor: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      skip: (input.page - 1) * input.pageSize,
      take: input.pageSize,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    rows: rows.map(toAuditLogDTO),
    total,
    page: input.page,
    pageSize: input.pageSize,
    totalPages: Math.ceil(total / input.pageSize),
  };
}
