import { type NextRequest } from "next/server";
import { requireUser, toActor } from "@/server/auth/session";
import { generateFlashcards, getFlashcards } from "@/services/ai-summaries.service";
import { ok, fail } from "@/server/api/response";
import { isAppError } from "@/services/errors";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> },
) {
  const { lessonId } = await params;
  const flashcards = await getFlashcards(lessonId);
  return ok(flashcards);
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> },
) {
  try {
    const { lessonId } = await params;
    const user = await requireUser();
    const flashcards = await generateFlashcards({ actor: toActor(user) }, lessonId);
    return ok(flashcards);
  } catch (e) {
    if (isAppError(e)) return fail(e);
    throw e;
  }
}
