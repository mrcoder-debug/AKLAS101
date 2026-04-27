"use server";

import { requireUser, toActor } from "@/server/auth/session";
import * as forumsService from "@/services/forums.service";
import { actionOk, actionFail, type ActionResult } from "@/server/api/response";
import type { ForumThreadDTO, ForumReplyDTO, ForumThreadDetailDTO } from "@/services/dto";

function makeCtx(actor: Awaited<ReturnType<typeof requireUser>>) {
  return { actor: toActor(actor) };
}

export async function listThreadsAction(
  courseId: string,
): Promise<ActionResult<ForumThreadDTO[]>> {
  try {
    const actor = await requireUser();
    const data = await forumsService.listThreads(makeCtx(actor), courseId);
    return actionOk(data);
  } catch (e) {
    return actionFail(e);
  }
}

export async function createThreadAction(
  rawInput: unknown,
): Promise<ActionResult<ForumThreadDTO>> {
  try {
    const actor = await requireUser();
    const data = await forumsService.createThread(makeCtx(actor), rawInput);
    return actionOk(data);
  } catch (e) {
    return actionFail(e);
  }
}

export async function getThreadAction(
  threadId: string,
): Promise<ActionResult<ForumThreadDetailDTO>> {
  try {
    const actor = await requireUser();
    const data = await forumsService.getThread(makeCtx(actor), threadId);
    return actionOk(data);
  } catch (e) {
    return actionFail(e);
  }
}

export async function createReplyAction(
  rawInput: unknown,
): Promise<ActionResult<ForumReplyDTO>> {
  try {
    const actor = await requireUser();
    const data = await forumsService.createReply(makeCtx(actor), rawInput);
    return actionOk(data);
  } catch (e) {
    return actionFail(e);
  }
}

export async function voteThreadAction(
  threadId: string,
  value: 1 | -1,
): Promise<ActionResult<{ voteScore: number; myVote: number | null }>> {
  try {
    const actor = await requireUser();
    const data = await forumsService.voteThread(makeCtx(actor), threadId, { value });
    return actionOk(data);
  } catch (e) {
    return actionFail(e);
  }
}

export async function voteReplyAction(
  replyId: string,
  value: 1 | -1,
): Promise<ActionResult<{ voteScore: number; myVote: number | null }>> {
  try {
    const actor = await requireUser();
    const data = await forumsService.voteReply(makeCtx(actor), replyId, { value });
    return actionOk(data);
  } catch (e) {
    return actionFail(e);
  }
}

export async function markAcceptedAction(replyId: string): Promise<ActionResult<void>> {
  try {
    const actor = await requireUser();
    await forumsService.markAccepted(makeCtx(actor), replyId);
    return actionOk(undefined);
  } catch (e) {
    return actionFail(e);
  }
}

export async function deleteThreadAction(threadId: string): Promise<ActionResult<void>> {
  try {
    const actor = await requireUser();
    await forumsService.deleteThread(makeCtx(actor), threadId);
    return actionOk(undefined);
  } catch (e) {
    return actionFail(e);
  }
}

export async function deleteReplyAction(replyId: string): Promise<ActionResult<void>> {
  try {
    const actor = await requireUser();
    await forumsService.deleteReply(makeCtx(actor), replyId);
    return actionOk(undefined);
  } catch (e) {
    return actionFail(e);
  }
}

export async function pinThreadAction(
  threadId: string,
  pinned: boolean,
): Promise<ActionResult<void>> {
  try {
    const actor = await requireUser();
    await forumsService.pinThread(makeCtx(actor), threadId, pinned);
    return actionOk(undefined);
  } catch (e) {
    return actionFail(e);
  }
}
