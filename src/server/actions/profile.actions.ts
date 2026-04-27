"use server";

import { requireUser, toActor } from "@/server/auth/session";
import * as usersService from "@/services/users.service";
import { actionOk, actionFail, type ActionResult } from "@/server/api/response";
import type { UserProfileDTO } from "@/services/dto";

function makeCtx(actor: Awaited<ReturnType<typeof requireUser>>) {
  return { actor: toActor(actor) };
}

export async function getOwnProfileAction(): Promise<ActionResult<UserProfileDTO>> {
  try {
    const actor = await requireUser();
    const data = await usersService.getOwnProfile(makeCtx(actor));
    return actionOk(data);
  } catch (e) {
    return actionFail(e);
  }
}

export async function updateProfileAction(
  rawInput: unknown,
): Promise<ActionResult<UserProfileDTO>> {
  try {
    const actor = await requireUser();
    const data = await usersService.updateProfile(makeCtx(actor), rawInput);
    return actionOk(data);
  } catch (e) {
    return actionFail(e);
  }
}
