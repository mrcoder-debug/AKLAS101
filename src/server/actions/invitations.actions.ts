"use server";

import { requireUser, toActor } from "@/server/auth/session";
import * as invitationsService from "@/services/invitations.service";
import { actionOk, actionFail, type ActionResult } from "@/server/api/response";
import type { InvitationDTO, UserDTO } from "@/services/dto";
import type { Paginated } from "@/schemas/common.schema";

function makeCtx(actor: Awaited<ReturnType<typeof requireUser>>) {
  return { actor: toActor(actor) };
}

export async function createInvitationAction(
  _prev: ActionResult<InvitationDTO>,
  formData: FormData,
): Promise<ActionResult<InvitationDTO>> {
  try {
    const actor = await requireUser();
    const raw = Object.fromEntries(formData.entries());
    const data = await invitationsService.createInvitation(makeCtx(actor), raw);
    return actionOk(data);
  } catch (e) {
    return actionFail(e);
  }
}

export async function resendInvitationAction(
  id: string,
): Promise<ActionResult<InvitationDTO>> {
  try {
    const actor = await requireUser();
    const data = await invitationsService.resendInvitation(makeCtx(actor), id);
    return actionOk(data);
  } catch (e) {
    return actionFail(e);
  }
}

export async function revokeInvitationAction(
  id: string,
): Promise<ActionResult<void>> {
  try {
    const actor = await requireUser();
    await invitationsService.revokeInvitation(makeCtx(actor), id);
    return actionOk(undefined);
  } catch (e) {
    return actionFail(e);
  }
}

export async function listInvitationsAction(
  rawInput: unknown,
): Promise<ActionResult<Paginated<InvitationDTO>>> {
  try {
    const actor = await requireUser();
    const data = await invitationsService.listInvitations(makeCtx(actor), rawInput);
    return actionOk(data);
  } catch (e) {
    return actionFail(e);
  }
}

// Public — no auth required (called from the activation page)
export async function acceptInvitationAction(
  token: string,
  _prev: ActionResult<UserDTO>,
  formData: FormData,
): Promise<ActionResult<UserDTO>> {
  try {
    const raw = Object.fromEntries(formData.entries());
    const data = await invitationsService.acceptInvitation(token, raw);
    return actionOk(data);
  } catch (e) {
    return actionFail(e);
  }
}
