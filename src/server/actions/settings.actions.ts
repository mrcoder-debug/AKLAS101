"use server";

import { requireUser, toActor } from "@/server/auth/session";
import * as usersService from "@/services/users.service";
import { actionOk, actionFail, type ActionResult } from "@/server/api/response";

function makeCtx(actor: Awaited<ReturnType<typeof requireUser>>) {
  return { actor: toActor(actor) };
}

export async function changePasswordAction(
  rawInput: unknown,
): Promise<ActionResult<void>> {
  try {
    const actor = await requireUser();
    await usersService.changeOwnPassword(makeCtx(actor), rawInput);
    return actionOk(undefined);
  } catch (e) {
    return actionFail(e);
  }
}
