import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";
import {
  changeRoleSchema,
  changePasswordSchema,
  createUserSchema,
  listUsersSchema,
  resetPasswordSchema,
  setActiveSchema,
  updateUserSchema,
  updateProfileSchema,
} from "@/schemas/user.schema";
import { bumpTokenVersion } from "./auth.service";
import { assertCan } from "./authorization";
import type { ServiceContext } from "./context";
import { requireActor } from "./context";
import { ConflictError, NotFoundError, ValidationError, ForbiddenError } from "./errors";
import { toUserDTO, toUserProfileDTO, type UserDTO, type UserProfileDTO } from "./dto";
import { parse, throwIfNotFound } from "./_util";
import type { Paginated } from "@/schemas/common.schema";
import type { Prisma } from "@prisma/client";

export async function listUsers(
  ctx: ServiceContext,
  rawInput: unknown,
): Promise<Paginated<UserDTO>> {
  const actor = requireActor(ctx);
  assertCan(actor, { action: "user:list" });
  const input = parse(listUsersSchema, rawInput);

  const where: Prisma.UserWhereInput = {
    deletedAt: null,
    ...(input.filters?.role ? { role: input.filters.role } : {}),
    ...(typeof input.filters?.isActive === "boolean"
      ? { isActive: input.filters.isActive }
      : {}),
    ...(input.q
      ? {
          OR: [
            { name: { contains: input.q, mode: "insensitive" } },
            { email: { contains: input.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const orderBy: Prisma.UserOrderByWithRelationInput = input.sort
    ? { [input.sort]: input.order ?? "desc" }
    : { createdAt: "desc" };

  const [rows, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      orderBy,
      skip: (input.page - 1) * input.pageSize,
      take: input.pageSize,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    rows: rows.map(toUserDTO),
    total,
    page: input.page,
    pageSize: input.pageSize,
    totalPages: Math.ceil(total / input.pageSize),
  };
}

export async function getUserById(
  ctx: ServiceContext,
  id: string,
): Promise<UserDTO> {
  const actor = requireActor(ctx);
  // Admin can look up anyone; users can look up themselves.
  if (actor.role !== "ADMIN" && actor.id !== id) {
    assertCan(actor, { action: "user:update", resource: { id } });
  }
  const u = await prisma.user.findFirst({ where: { id, deletedAt: null } });
  if (!u) throw new NotFoundError("User");
  return toUserDTO(u);
}

export async function createUser(
  ctx: ServiceContext,
  rawInput: unknown,
): Promise<UserDTO> {
  const actor = requireActor(ctx);
  assertCan(actor, { action: "user:create" });
  const input = parse(createUserSchema, rawInput);

  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new ConflictError("A user with that email already exists");

  const passwordHash = await hashPassword(input.password);

  const created = await prisma.user.create({
    data: {
      email: input.email,
      name: input.name,
      role: input.role,
      passwordHash,
    },
  });
  return toUserDTO(created);
}

export async function updateUser(
  ctx: ServiceContext,
  id: string,
  rawInput: unknown,
): Promise<UserDTO> {
  const actor = requireActor(ctx);
  assertCan(actor, { action: "user:update", resource: { id } });
  const input = parse(updateUserSchema, rawInput);

  if (input.email) {
    const conflict = await prisma.user.findFirst({
      where: { email: input.email, NOT: { id } },
    });
    if (conflict) throw new ConflictError("A user with that email already exists");
  }

  const updated = await prisma.user
    .update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.email !== undefined ? { email: input.email } : {}),
      },
    })
    .catch(throwIfNotFound("User"));

  return toUserDTO(updated);
}

export async function changeUserRole(
  ctx: ServiceContext,
  id: string,
  rawInput: unknown,
): Promise<UserDTO> {
  const actor = requireActor(ctx);
  assertCan(actor, { action: "user:changeRole", resource: { id } });
  const { role } = parse(changeRoleSchema, rawInput);

  // Role change revokes live sessions (tokenVersion bump).
  const updated = await prisma.$transaction(async (tx) => {
    const u = await tx.user.findFirst({ where: { id, deletedAt: null } });
    if (!u) throw new NotFoundError("User");
    if (u.role === role) return u;
    await bumpTokenVersion(tx, id);
    return tx.user.update({ where: { id }, data: { role } });
  });

  return toUserDTO(updated);
}

export async function setUserActive(
  ctx: ServiceContext,
  id: string,
  rawInput: unknown,
): Promise<UserDTO> {
  const actor = requireActor(ctx);
  assertCan(actor, { action: "user:deactivate", resource: { id } });
  const { isActive } = parse(setActiveSchema, rawInput);

  if (actor.id === id && !isActive) {
    throw new ValidationError("You cannot deactivate your own account");
  }

  const updated = await prisma.$transaction(async (tx) => {
    const u = await tx.user.findFirst({ where: { id, deletedAt: null } });
    if (!u) throw new NotFoundError("User");
    if (u.isActive === isActive) return u;
    // Any change bumps the version — deactivation kicks live sessions immediately.
    await bumpTokenVersion(tx, id);
    return tx.user.update({ where: { id }, data: { isActive } });
  });

  return toUserDTO(updated);
}

export async function resetUserPassword(
  ctx: ServiceContext,
  id: string,
  rawInput: unknown,
): Promise<void> {
  const actor = requireActor(ctx);
  assertCan(actor, { action: "user:update", resource: { id } });
  const { password } = parse(resetPasswordSchema, rawInput);
  const hash = await hashPassword(password);
  await prisma.$transaction(async (tx) => {
    const u = await tx.user.findFirst({ where: { id, deletedAt: null } });
    if (!u) throw new NotFoundError("User");
    await bumpTokenVersion(tx, id);
    await tx.user.update({ where: { id }, data: { passwordHash: hash } });
  });
}

export async function softDeleteUser(
  ctx: ServiceContext,
  id: string,
): Promise<void> {
  const actor = requireActor(ctx);
  assertCan(actor, { action: "user:delete", resource: { id } });

  if (actor.id === id) {
    throw new ValidationError("You cannot delete your own account");
  }

  await prisma.$transaction(async (tx) => {
    const u = await tx.user.findFirst({ where: { id, deletedAt: null } });
    if (!u) throw new NotFoundError("User");
    await bumpTokenVersion(tx, id);
    await tx.user.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  });
}

export async function getOwnProfile(ctx: ServiceContext): Promise<UserProfileDTO> {
  const actor = requireActor(ctx);
  const u = await prisma.user.findFirst({ where: { id: actor.id, deletedAt: null } });
  if (!u) throw new NotFoundError("User");
  return toUserProfileDTO(u);
}

export async function updateProfile(
  ctx: ServiceContext,
  rawInput: unknown,
): Promise<UserProfileDTO> {
  const actor = requireActor(ctx);
  assertCan(actor, { action: "profile:update", resource: { id: actor.id } });
  const input = parse(updateProfileSchema, rawInput);

  const updated = await prisma.user
    .update({
      where: { id: actor.id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.avatarUrl !== undefined ? { avatarUrl: input.avatarUrl } : {}),
        ...(input.bio !== undefined ? { bio: input.bio } : {}),
        ...(input.linkedinUrl !== undefined ? { linkedinUrl: input.linkedinUrl } : {}),
        ...(input.twitterUrl !== undefined ? { twitterUrl: input.twitterUrl } : {}),
        ...(input.githubUrl !== undefined ? { githubUrl: input.githubUrl } : {}),
      },
    })
    .catch(throwIfNotFound("User"));

  return toUserProfileDTO(updated);
}

export async function changeOwnPassword(
  ctx: ServiceContext,
  rawInput: unknown,
): Promise<void> {
  const actor = requireActor(ctx);
  const { currentPassword, newPassword } = parse(changePasswordSchema, rawInput);

  const u = await prisma.user.findFirst({ where: { id: actor.id, deletedAt: null } });
  if (!u) throw new NotFoundError("User");

  const ok = await verifyPassword(currentPassword, u.passwordHash);
  if (!ok) throw new ForbiddenError("Current password is incorrect");

  const hash = await hashPassword(newPassword);

  await prisma.$transaction(async (tx) => {
    await bumpTokenVersion(tx, actor.id);
    await tx.user.update({ where: { id: actor.id }, data: { passwordHash: hash } });
  });
}

