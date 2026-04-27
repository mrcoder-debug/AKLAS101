import type { PrismaClient, AuditAction } from "@prisma/client";
import type { Prisma } from "@prisma/client";

type Tx = Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

export async function logAudit(
  tx: Tx,
  actorId: string,
  action: AuditAction,
  targetType: string,
  targetId: string,
  meta?: Record<string, unknown>,
): Promise<void> {
  await tx.auditLog.create({
    data: {
      actorId,
      action,
      targetType,
      targetId,
      meta: meta as Prisma.InputJsonValue | undefined,
    },
  });
}
