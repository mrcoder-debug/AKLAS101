import { type NextRequest } from "next/server";
import { ok, fail } from "@/server/api/response";
import { requireUser, toActor } from "@/server/auth/session";
import { autosaveAttempt } from "@/services/attempts.service";
import { attemptAnswersSchema } from "@/schemas/quiz.schema";
import { ValidationError } from "@/services/errors";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: attemptId } = await params;
    const user = await requireUser();
    const body = await request.json() as unknown;
    const parsed = attemptAnswersSchema.safeParse(
      (typeof body === "object" && body !== null && "answers" in body)
        ? (body as { answers: unknown }).answers
        : {},
    );
    if (!parsed.success) throw new ValidationError("Invalid answers");

    const data = await autosaveAttempt(
      { actor: toActor(user) },
      { attemptId, answers: parsed.data },
    );
    return ok(data);
  } catch (e) {
    return fail(e);
  }
}
