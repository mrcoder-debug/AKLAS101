import { NextResponse } from "next/server";
import { isAppError } from "@/services/errors";
import { logger } from "@/lib/logger";
import { ZodError } from "zod";

export interface ApiSuccess<T> {
  success: true;
  data: T;
}
export interface ApiError {
  success: false;
  error: { code: string; message: string; details?: unknown };
}
export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export function ok<T>(data: T, status = 200): NextResponse<ApiSuccess<T>> {
  return NextResponse.json({ success: true, data }, { status });
}

export function fail(err: unknown): NextResponse<ApiError> {
  if (isAppError(err)) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: err.code,
          message: err.message,
          ...(err.status === 400 && err.details ? { details: err.details } : {}),
        },
      },
      { status: err.status },
    );
  }

  if (err instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "VALIDATION", message: "Invalid input", details: err.flatten() },
      },
      { status: 400 },
    );
  }

  logger.error("Unhandled API error", {
    err: err instanceof Error ? { message: err.message, stack: err.stack } : String(err),
  });
  return NextResponse.json(
    { success: false, error: { code: "INTERNAL", message: "An unexpected error occurred" } },
    { status: 500 },
  );
}

// Action result type — for Server Actions (not NextResponse).
export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string; details?: unknown } };

export function actionOk<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

export function actionFail(err: unknown): ActionResult<never> {
  if (isAppError(err)) {
    return {
      ok: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.status === 400 && err.details ? { details: err.details } : {}),
      },
    };
  }
  logger.error("Unhandled action error", {
    err: err instanceof Error ? { message: err.message, stack: err.stack } : String(err),
  });
  return { ok: false, error: { code: "INTERNAL", message: "An unexpected error occurred" } };
}
