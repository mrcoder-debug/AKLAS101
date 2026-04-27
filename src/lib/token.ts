import crypto from "node:crypto";

export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function getTokenExpiry(hours = 72): Date {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

export function isTokenExpired(expiresAt: Date): boolean {
  return expiresAt < new Date();
}
