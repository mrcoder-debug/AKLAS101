// Authentication primitives. Used by the NextAuth Credentials provider and by
// admin mutations that need to bump a user's tokenVersion (immediate revocation).
//
// This module DOES touch Prisma directly — services are the allowed boundary.

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { verifyPassword } from "@/lib/password";
import type { Actor } from "./authorization";
import { UnauthorizedError } from "./errors";

type Tx = Prisma.TransactionClient | typeof prisma;

export interface SessionUser extends Actor {
  email: string;
  name: string;
  tokenVersion: number;
}

function toSessionUser(u: {
  id: string;
  email: string;
  name: string;
  role: Actor["role"];
  isActive: boolean;
  tokenVersion: number;
}): SessionUser {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    isActive: u.isActive,
    tokenVersion: u.tokenVersion,
  };
}

// Called from the NextAuth Credentials provider. Returns a minimal user
// principal or throws UnauthorizedError.
export async function verifyCredentials(
  email: string,
  password: string,
): Promise<SessionUser> {
  const normalized = email.trim().toLowerCase();
  const user = await prisma.user.findFirst({
    where: { email: normalized, deletedAt: null },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      tokenVersion: true,
      passwordHash: true,
    },
  });
  if (!user) throw new UnauthorizedError("Invalid email or password");
  if (!user.isActive) throw new UnauthorizedError("Account is deactivated");

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) throw new UnauthorizedError("Invalid email or password");

  return toSessionUser(user);
}

// Called on every session read by Auth.js. If the DB's tokenVersion is ahead of
// the JWT's, the session is stale — return null to force a re-login.
export async function getSessionUserIfCurrent(
  userId: string,
  tokenVersion: number,
): Promise<SessionUser | null> {
  const u = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      tokenVersion: true,
    },
  });
  if (!u) return null;
  if (!u.isActive) return null;
  if (u.tokenVersion !== tokenVersion) return null;
  return toSessionUser(u);
}

// Admin actions invalidate all live sessions for a user by bumping the version.
// Callers should run this INSIDE the same transaction as the state change that
// triggered the revocation (e.g. role change, deactivation, password reset).
export async function bumpTokenVersion(tx: Tx, userId: string): Promise<void> {
  await tx.user.update({
    where: { id: userId },
    data: { tokenVersion: { increment: 1 } },
  });
}
