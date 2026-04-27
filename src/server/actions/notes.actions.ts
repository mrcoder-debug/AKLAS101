"use server";

import { requireUser, toActor } from "@/server/auth/session";
import * as notesService from "@/services/notes.service";
import { actionOk, actionFail, type ActionResult } from "@/server/api/response";
import type { NoteDTO } from "@/services/notes.service";

function makeCtx(actor: Awaited<ReturnType<typeof requireUser>>) {
  return { actor: toActor(actor) };
}

export async function listNotesAction(lessonId: string): Promise<ActionResult<NoteDTO[]>> {
  try {
    const actor = await requireUser();
    const data = await notesService.listNotesForLesson(makeCtx(actor), lessonId);
    return actionOk(data);
  } catch (e) {
    return actionFail(e);
  }
}

export async function createNoteAction(rawInput: unknown): Promise<ActionResult<NoteDTO>> {
  try {
    const actor = await requireUser();
    const data = await notesService.createNote(makeCtx(actor), rawInput);
    return actionOk(data);
  } catch (e) {
    return actionFail(e);
  }
}

export async function updateNoteAction(
  noteId: string,
  rawInput: unknown,
): Promise<ActionResult<NoteDTO>> {
  try {
    const actor = await requireUser();
    const data = await notesService.updateNote(makeCtx(actor), noteId, rawInput);
    return actionOk(data);
  } catch (e) {
    return actionFail(e);
  }
}

export async function deleteNoteAction(noteId: string): Promise<ActionResult<void>> {
  try {
    const actor = await requireUser();
    await notesService.deleteNote(makeCtx(actor), noteId);
    return actionOk(undefined);
  } catch (e) {
    return actionFail(e);
  }
}
