import type { Actor } from "./authorization";
import { UnauthorizedError } from "./errors";

// Every service action takes a ctx. The actor is the authenticated user as
// loaded from the session in src/server/auth/session.ts.
export interface ServiceContext {
  actor: Actor | null;
}

export function requireActor(ctx: ServiceContext): Actor {
  if (!ctx.actor) throw new UnauthorizedError();
  return ctx.actor;
}
