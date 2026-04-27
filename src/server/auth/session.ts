// Server-only session helpers. Import these from RSC, Server Actions, and
// service tests. Never import from client components.

import { auth } from "./index";
import { redirect } from "next/navigation";
import type { Actor } from "@/services/authorization";
import { UnauthorizedError } from "@/services/errors";

export type AuthenticatedUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

export async function getCurrentUser() {
  try {
    const session = await auth();
    if (!session?.user?.id) return null;
    return session.user as {
      id: string;
      email: string;
      name: string;
      role: "ADMIN" | "INSTRUCTOR" | "STUDENT";
      isActive: boolean;
      tokenVersion: number;
    };
  } catch {
    // SESSION_REVOKED or any auth error → treat as unauthenticated.
    return null;
  }
}

// Throws UnauthorizedError (for service adapters).
export async function requireUser(): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();
  if (!user) throw new UnauthorizedError();
  return user;
}

// Redirects to /login (for RSC / layouts).
export async function requireUserOrRedirect(): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireRole(
  allowed: Array<"ADMIN" | "INSTRUCTOR" | "STUDENT">,
): Promise<AuthenticatedUser> {
  const user = await requireUserOrRedirect();
  if (!allowed.includes(user.role)) redirect("/");
  return user;
}

// Converts a session user to the Actor interface used by services.
export function toActor(user: AuthenticatedUser): Actor {
  return { id: user.id, role: user.role, isActive: user.isActive };
}
