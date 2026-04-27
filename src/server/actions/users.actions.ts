"use server";

import { requireUser, toActor } from "@/server/auth/session";
import * as usersService from "@/services/users.service";
import { actionOk, actionFail, type ActionResult } from "@/server/api/response";
import type { UserDTO } from "@/services/dto";
import type { Paginated } from "@/schemas/common.schema";

function makeCtx(actor: Awaited<ReturnType<typeof requireUser>>) {
  return { actor: toActor(actor) };
}

export async function listUsersAction(
  rawInput: unknown,
): Promise<ActionResult<Paginated<UserDTO>>> {
  try {
    const actor = await requireUser();
    const data = await usersService.listUsers(makeCtx(actor), rawInput);
    return actionOk(data);
  } catch (e) {
    return actionFail(e);
  }
}

export async function createUserAction(
  _prev: ActionResult<UserDTO>,
  formData: FormData,
): Promise<ActionResult<UserDTO>> {
  try {
    const actor = await requireUser();
    const raw = Object.fromEntries(formData.entries());
    const data = await usersService.createUser(makeCtx(actor), raw);
    return actionOk(data);
  } catch (e) {
    return actionFail(e);
  }
}

export async function updateUserAction(
  id: string,
  rawInput: unknown,
): Promise<ActionResult<UserDTO>> {
  try {
    const actor = await requireUser();
    const data = await usersService.updateUser(makeCtx(actor), id, rawInput);
    return actionOk(data);
  } catch (e) {
    return actionFail(e);
  }
}

export async function changeRoleAction(
  id: string,
  role: string,
): Promise<ActionResult<UserDTO>> {
  try {
    const actor = await requireUser();
    const data = await usersService.changeUserRole(makeCtx(actor), id, { role });
    return actionOk(data);
  } catch (e) {
    return actionFail(e);
  }
}

export async function setActiveAction(
  id: string,
  isActive: boolean,
): Promise<ActionResult<UserDTO>> {
  try {
    const actor = await requireUser();
    const data = await usersService.setUserActive(makeCtx(actor), id, { isActive });
    return actionOk(data);
  } catch (e) {
    return actionFail(e);
  }
}

export async function resetPasswordAction(
  id: string,
  password: string,
): Promise<ActionResult<void>> {
  try {
    const actor = await requireUser();
    await usersService.resetUserPassword(makeCtx(actor), id, { password });
    return actionOk(undefined);
  } catch (e) {
    return actionFail(e);
  }
}

export async function deleteUserAction(id: string): Promise<ActionResult<void>> {
  try {
    const actor = await requireUser();
    await usersService.softDeleteUser(makeCtx(actor), id);
    return actionOk(undefined);
  } catch (e) {
    return actionFail(e);
  }
}
