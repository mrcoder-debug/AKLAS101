import { type NextRequest } from "next/server";
import { requireUser, toActor } from "@/server/auth/session";
import { generateSummary, getSummary } from "@/services/ai-summaries.service";
import { ok, fail } from "@/server/api/response";
import { isAppError } from "@/services/errors";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> },
) {
  const { lessonId } = await params;
  const summary = await getSummary(lessonId);
  return ok(summary);
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> },
) {
  try {
    const { lessonId } = await params;
    const user = await requireUser();
    const summary = await generateSummary({ actor: toActor(user) }, lessonId);
    return ok(summary);
  } catch (e) {
    if (isAppError(e)) return fail(e);
    throw e;
  }
}
