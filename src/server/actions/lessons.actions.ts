"use server";

import { requireUser, toActor } from "@/server/auth/session";
import * as lessonsService from "@/services/lessons.service";
import { actionOk, actionFail, type ActionResult } from "@/server/api/response";
import type { LessonDTO } from "@/services/dto";

function makeCtx(actor: Awaited<ReturnType<typeof requireUser>>) {
  return { actor: toActor(actor) };
}

export async function createLessonAction(rawInput: unknown): Promise<ActionResult<LessonDTO>> {
  try {
    const actor = await requireUser();
    const data = await lessonsService.createLesson(makeCtx(actor), rawInput);
    return actionOk(data);
  } catch (e) {
    return actionFail(e);
  }
}

export async function updateLessonAction(
  id: string,
  rawInput: unknown,
): Promise<ActionResult<LessonDTO>> {
  try {
    const actor = await requireUser();
    const data = await lessonsService.updateLesson(makeCtx(actor), id, rawInput);
    return actionOk(data);
  } catch (e) {
    return actionFail(e);
  }
}

export async function publishLessonAction(
  id: string,
  isPublished: boolean,
): Promise<ActionResult<LessonDTO>> {
  try {
    const actor = await requireUser();
    const data = await lessonsService.setLessonPublished(makeCtx(actor), id, isPublished);
    return actionOk(data);
  } catch (e) {
    return actionFail(e);
  }
}

export async function reorderLessonsAction(rawInput: unknown): Promise<ActionResult<LessonDTO[]>> {
  try {
    const actor = await requireUser();
    const data = await lessonsService.reorderLessons(makeCtx(actor), rawInput);
    return actionOk(data);
  } catch (e) {
    return actionFail(e);
  }
}

export async function deleteLessonAction(id: string): Promise<ActionResult<void>> {
  try {
    const actor = await requireUser();
    await lessonsService.softDeleteLesson(makeCtx(actor), id);
    return actionOk(undefined);
  } catch (e) {
    return actionFail(e);
  }
}
