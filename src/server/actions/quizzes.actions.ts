"use server";

import { requireUser, toActor } from "@/server/auth/session";
import * as quizzesService from "@/services/quizzes.service";
import * as attemptsService from "@/services/attempts.service";
import { actionOk, actionFail, type ActionResult } from "@/server/api/response";
import type { AuthorQuizDTO, AttemptDTO } from "@/services/dto";

function makeCtx(actor: Awaited<ReturnType<typeof requireUser>>) {
  return { actor: toActor(actor) };
}

export async function upsertQuizAction(rawInput: unknown): Promise<ActionResult<AuthorQuizDTO>> {
  try {
    const actor = await requireUser();
    const data = await quizzesService.upsertQuiz(makeCtx(actor), rawInput);
    return actionOk(data);
  } catch (e) {
    return actionFail(e);
  }
}

export async function deleteQuizAction(lessonId: string): Promise<ActionResult<void>> {
  try {
    const actor = await requireUser();
    await quizzesService.softDeleteQuiz(makeCtx(actor), lessonId);
    return actionOk(undefined);
  } catch (e) {
    return actionFail(e);
  }
}

export async function startAttemptAction(quizId: string): Promise<ActionResult<AttemptDTO>> {
  try {
    const actor = await requireUser();
    const data = await attemptsService.startAttempt(makeCtx(actor), { quizId });
    return actionOk(data);
  } catch (e) {
    return actionFail(e);
  }
}

export async function submitAttemptAction(
  attemptId: string,
  answers: Record<string, string>,
): Promise<ActionResult<AttemptDTO>> {
  try {
    const actor = await requireUser();
    const data = await attemptsService.submitAttempt(makeCtx(actor), { attemptId, answers });
    return actionOk(data);
  } catch (e) {
    return actionFail(e);
  }
}
