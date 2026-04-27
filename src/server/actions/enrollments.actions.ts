"use server";

import { requireUser, toActor } from "@/server/auth/session";
import * as enrollmentsService from "@/services/enrollments.service";
import { actionOk, actionFail, type ActionResult } from "@/server/api/response";
import type { EnrollmentDTO } from "@/services/dto";
import type { Paginated } from "@/schemas/common.schema";

function makeCtx(actor: Awaited<ReturnType<typeof requireUser>>) {
  return { actor: toActor(actor) };
}

export async function enrollUsersAction(
  courseId: string,
  userIds: string[],
): Promise<ActionResult<EnrollmentDTO[]>> {
  try {
    const actor = await requireUser();
    const data = await enrollmentsService.enrollUsers(makeCtx(actor), { courseId, userIds });
    return actionOk(data);
  } catch (e) {
    return actionFail(e);
  }
}

export async function revokeEnrollmentAction(
  enrollmentId: string,
): Promise<ActionResult<EnrollmentDTO>> {
  try {
    const actor = await requireUser();
    const data = await enrollmentsService.revokeEnrollment(makeCtx(actor), enrollmentId);
    return actionOk(data);
  } catch (e) {
    return actionFail(e);
  }
}

export async function listEnrollmentsAction(
  rawInput: unknown,
): Promise<ActionResult<Paginated<EnrollmentDTO>>> {
  try {
    const actor = await requireUser();
    const data = await enrollmentsService.listEnrollments(makeCtx(actor), rawInput);
    return actionOk(data);
  } catch (e) {
    return actionFail(e);
  }
}
