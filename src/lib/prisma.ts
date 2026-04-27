import { PrismaClient } from "@prisma/client";

// HMR-safe singleton. In dev, Next.js hot-reloads modules, so we cache the client
// on globalThis to avoid exhausting Postgres connections.
declare global {
  // eslint-disable-next-line no-var
  var __prisma__: PrismaClient | undefined;
}

function makeClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const prisma: PrismaClient =
  globalThis.__prisma__ ?? makeClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma__ = prisma;
}
