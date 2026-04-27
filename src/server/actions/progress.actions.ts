"use server";

import { requireUser, toActor } from "@/server/auth/session";
import * as progressService from "@/services/progress.service";
import { actionOk, actionFail, type ActionResult } from "@/server/api/response";
import type { ProgressDTO } from "@/services/dto";

export interface MarkCompleteResult {
  progress: ProgressDTO;
  certificateIssued: boolean;
}

function makeCtx(actor: Awaited<ReturnType<typeof requireUser>>) {
  return { actor: toActor(actor) };
}

export async function markLessonCompleteAction(
  lessonId: string,
): Promise<ActionResult<MarkCompleteResult>> {
  try {
    const actor = await requireUser();
    const result = await progressService.markLessonComplete(makeCtx(actor), lessonId);
    return actionOk(result);
  } catch (e) {
    return actionFail(e);
  }
}
