import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { generateSecureToken, getTokenExpiry, isTokenExpired } from "@/lib/token";
import { sendInviteEmail } from "@/lib/email";
import { logAudit } from "@/lib/audit";
import { assertCan } from "./authorization";
import type { ServiceContext } from "./context";
import { requireActor } from "./context";
import { ConflictError, NotFoundError, ValidationError } from "./errors";
import { toInvitationDTO, toUserDTO, type InvitationDTO, type UserDTO } from "./dto";
import { parse } from "./_util";
import {
  createInvitationSchema,
  acceptInvitationSchema,
  type CreateInvitationInput,
  type AcceptInvitationInput,
} from "@/schemas/invitation.schema";
import type { Paginated } from "@/schemas/common.schema";
import { z } from "zod";

const listInvitationsSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  status: z.enum(["PENDING", "ACCEPTED", "REVOKED", "EXPIRED"]).optional(),
});

const invitationWithRelations = {
  invitedBy: { select: { name: true } },
} as const;

export async function createInvitation(
  ctx: ServiceContext,
  rawInput: unknown,
): Promise<InvitationDTO> {
  const actor = requireActor(ctx);
  assertCan(actor, { action: "invitation:create" });
  const input = parse(createInvitationSchema, rawInput);

  // Check for existing active user with this email
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true, deletedAt: true },
  });
  if (existingUser && !existingUser.deletedAt) {
    throw new ConflictError(`A user with email ${input.email} already exists`);
  }

  // Check for pending invitation with same email
  const existingInvite = await prisma.invitation.findFirst({
    where: { email: input.email, status: "PENDING" },
    select: { id: true },
  });
  if (existingInvite) {
    throw new ConflictError(
      `A pending invitation for ${input.email} already exists. Resend it or revoke it first.`,
    );
  }

  const token = generateSecureToken();
  const expiresAt = getTokenExpiry(72);

  const invitation = await prisma.$transaction(async (tx) => {
    const inv = await tx.invitation.create({
      data: {
        email: input.email,
        role: input.role,
        token,
        expiresAt,
        invitedById: actor.id,
      },
      include: invitationWithRelations,
    });
    await logAudit(tx, actor.id, "INVITE_SENT", "Invitation", inv.id, {
      email: input.email,
      role: input.role,
    });
    return inv;
  });

  // Send email outside the transaction (non-critical path)
  await sendInviteEmail({
    to: invitation.email,
    token,
    inviterName: invitation.invitedBy.name,
    role: invitation.role as "INSTRUCTOR" | "STUDENT",
  });

  return toInvitationDTO(invitation);
}

export async function resendInvitation(
  ctx: ServiceContext,
  id: string,
): Promise<InvitationDTO> {
  const actor = requireActor(ctx);
  assertCan(actor, { action: "invitation:resend", resource: { id, invitedById: "" } });

  const existing = await prisma.invitation.findUnique({
    where: { id },
    include: invitationWithRelations,
  });
  if (!existing) throw new NotFoundError("Invitation");
  if (existing.status === "ACCEPTED") {
    throw new ValidationError("Cannot resend an accepted invitation");
  }

  const token = generateSecureToken();
  const expiresAt = getTokenExpiry(72);

  const updated = await prisma.$transaction(async (tx) => {
    const inv = await tx.invitation.update({
      where: { id },
      data: { token, expiresAt, status: "PENDING" },
      include: invitationWithRelations,
    });
    await logAudit(tx, actor.id, "INVITE_RESENT", "Invitation", id, {
      email: existing.email,
    });
    return inv;
  });

  await sendInviteEmail({
    to: updated.email,
    token,
    inviterName: updated.invitedBy.name,
    role: updated.role as "INSTRUCTOR" | "STUDENT",
  });

  return toInvitationDTO(updated);
}

export async function revokeInvitation(
  ctx: ServiceContext,
  id: string,
): Promise<void> {
  const actor = requireActor(ctx);
  assertCan(actor, { action: "invitation:revoke", resource: { id, invitedById: "" } });

  const existing = await prisma.invitation.findUnique({
    where: { id },
    select: { id: true, email: true, status: true },
  });
  if (!existing) throw new NotFoundError("Invitation");
  if (existing.status === "ACCEPTED") {
    throw new ValidationError("Cannot revoke an accepted invitation");
  }

  await prisma.$transaction(async (tx) => {
    await tx.invitation.update({ where: { id }, data: { status: "REVOKED" } });
    await logAudit(tx, actor.id, "INVITE_REVOKED", "Invitation", id, {
      email: existing.email,
    });
  });
}

export async function listInvitations(
  ctx: ServiceContext,
  rawInput: unknown,
): Promise<Paginated<InvitationDTO>> {
  const actor = requireActor(ctx);
  assertCan(actor, { action: "invitation:list" });
  const input = parse(listInvitationsSchema, rawInput);

  const where = input.status ? { status: input.status } : {};

  const [rows, total] = await prisma.$transaction([
    prisma.invitation.findMany({
      where,
      include: invitationWithRelations,
      orderBy: { createdAt: "desc" },
      skip: (input.page - 1) * input.pageSize,
      take: input.pageSize,
    }),
    prisma.invitation.count({ where }),
  ]);

  return {
    rows: rows.map(toInvitationDTO),
    total,
    page: input.page,
    pageSize: input.pageSize,
    totalPages: Math.ceil(total / input.pageSize),
  };
}

// Public (no auth context) — used on the activation page.
export async function validateToken(token: string): Promise<{
  id: string;
  email: string;
  role: "INSTRUCTOR" | "STUDENT";
  expiresAt: Date;
} | null> {
  const invitation = await prisma.invitation.findUnique({
    where: { token },
    select: { id: true, email: true, role: true, expiresAt: true, status: true },
  });
  if (!invitation) return null;
  if (invitation.status !== "PENDING") return null;
  if (isTokenExpired(invitation.expiresAt)) {
    // Mark as expired lazily
    await prisma.invitation.update({ where: { token }, data: { status: "EXPIRED" } });
    return null;
  }
  return {
    id: invitation.id,
    email: invitation.email,
    role: invitation.role as "INSTRUCTOR" | "STUDENT",
    expiresAt: invitation.expiresAt,
  };
}

// Public — called when the invited user sets their password.
export async function acceptInvitation(
  token: string,
  rawInput: unknown,
): Promise<UserDTO> {
  const input = parse(acceptInvitationSchema, rawInput);

  const invitation = await prisma.invitation.findUnique({
    where: { token },
    select: {
      id: true,
      email: true,
      role: true,
      expiresAt: true,
      status: true,
      invitedById: true,
    },
  });

  if (!invitation || invitation.status !== "PENDING") {
    throw new ValidationError("This invitation is no longer valid");
  }
  if (isTokenExpired(invitation.expiresAt)) {
    await prisma.invitation.update({ where: { token }, data: { status: "EXPIRED" } });
    throw new ValidationError("This invitation has expired");
  }

  const passwordHash = await hashPassword(input.password);

  const user = await prisma.$transaction(async (tx) => {
    // Mark invitation ACCEPTED
    await tx.invitation.update({
      where: { id: invitation.id },
      data: { status: "ACCEPTED", acceptedAt: new Date() },
    });

    // Create the user account
    const newUser = await tx.user.create({
      data: {
        email: invitation.email,
        name: input.name,
        role: invitation.role,
        passwordHash,
        isActive: true,
      },
    });

    // Audit log
    await logAudit(tx, invitation.invitedById, "USER_CREATED", "User", newUser.id, {
      email: newUser.email,
      role: newUser.role,
      via: "invitation",
    });
    await logAudit(tx, invitation.invitedById, "INVITE_ACCEPTED", "Invitation", invitation.id, {
      email: invitation.email,
      userId: newUser.id,
    });

    return newUser;
  });

  return toUserDTO(user);
}
