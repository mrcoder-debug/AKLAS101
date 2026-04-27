import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { assertCan } from "./authorization";
import type { ServiceContext } from "./context";
import { requireActor } from "./context";
import { ForbiddenError, NotFoundError } from "./errors";
import type { LessonNote } from "@prisma/client";

export interface NoteDTO {
  id: string;
  lessonId: string;
  content: string;
  videoTimestamp: number | null;
  createdAt: Date;
  updatedAt: Date;
}

function toNoteDTO(n: LessonNote): NoteDTO {
  return {
    id: n.id,
    lessonId: n.lessonId,
    content: n.content,
    videoTimestamp: n.videoTimestamp,
    createdAt: n.createdAt,
    updatedAt: n.updatedAt,
  };
}

const createNoteSchema = z.object({
  lessonId: z.string().cuid(),
  content: z.string().trim().min(1).max(5000),
  videoTimestamp: z.number().int().min(0).nullish(),
});

const updateNoteSchema = z.object({
  content: z.string().trim().min(1).max(5000),
  videoTimestamp: z.number().int().min(0).nullish(),
});

export async function listNotesForLesson(
  ctx: ServiceContext,
  lessonId: string,
): Promise<NoteDTO[]> {
  const actor = requireActor(ctx);
  const notes = await prisma.lessonNote.findMany({
    where: { userId: actor.id, lessonId },
    orderBy: { createdAt: "asc" },
  });
  return notes.map(toNoteDTO);
}

export async function createNote(
  ctx: ServiceContext,
  rawInput: unknown,
): Promise<NoteDTO> {
  const actor = requireActor(ctx);
  const input = createNoteSchema.parse(rawInput);

  const note = await prisma.lessonNote.create({
    data: {
      userId: actor.id,
      lessonId: input.lessonId,
      content: input.content,
      videoTimestamp: input.videoTimestamp ?? null,
    },
  });
  return toNoteDTO(note);
}

export async function updateNote(
  ctx: ServiceContext,
  noteId: string,
  rawInput: unknown,
): Promise<NoteDTO> {
  const actor = requireActor(ctx);
  const existing = await prisma.lessonNote.findUnique({ where: { id: noteId } });
  if (!existing) throw new NotFoundError("Note");
  if (existing.userId !== actor.id) throw new ForbiddenError();

  const input = updateNoteSchema.parse(rawInput);
  const updated = await prisma.lessonNote.update({
    where: { id: noteId },
    data: {
      content: input.content,
      videoTimestamp: input.videoTimestamp ?? null,
    },
  });
  return toNoteDTO(updated);
}

export async function deleteNote(ctx: ServiceContext, noteId: string): Promise<void> {
  const actor = requireActor(ctx);
  const existing = await prisma.lessonNote.findUnique({ where: { id: noteId } });
  if (!existing) throw new NotFoundError("Note");
  if (existing.userId !== actor.id) throw new ForbiddenError();
  await prisma.lessonNote.delete({ where: { id: noteId } });
}
