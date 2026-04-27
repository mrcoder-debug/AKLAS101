import { describe, expect, it } from "vitest";
import {
  AppError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  isAppError,
} from "@/services/errors";

describe("AppError taxonomy", () => {
  it("ValidationError has correct status and code", () => {
    const e = new ValidationError("bad input");
    expect(e.status).toBe(400);
    expect(e.code).toBe("VALIDATION");
    expect(e instanceof AppError).toBe(true);
    expect(isAppError(e)).toBe(true);
  });

  it("UnauthorizedError status 401", () => {
    expect(new UnauthorizedError().status).toBe(401);
  });

  it("ForbiddenError status 403", () => {
    expect(new ForbiddenError().status).toBe(403);
  });

  it("NotFoundError status 404 with resource name", () => {
    const e = new NotFoundError("Course");
    expect(e.status).toBe(404);
    expect(e.message).toContain("Course");
  });

  it("ConflictError status 409", () => {
    expect(new ConflictError().status).toBe(409);
  });

  it("isAppError returns false for non-AppErrors", () => {
    expect(isAppError(new Error("plain"))).toBe(false);
    expect(isAppError("string")).toBe(false);
    expect(isAppError(null)).toBe(false);
  });
});
