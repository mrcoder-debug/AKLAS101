"use server";

import { requireUser, toActor } from "@/server/auth/session";
import * as coursesService from "@/services/courses.service";
import { actionOk, actionFail, type ActionResult } from "@/server/api/response";
import type { CourseDTO } from "@/services/dto";
import type { Paginated } from "@/schemas/common.schema";

function makeCtx(actor: Awaited<ReturnType<typeof requireUser>>) {
  return { actor: toActor(actor) };
}

export async function listCoursesAction(
  rawInput: unknown,
): Promise<ActionResult<Paginated<CourseDTO>>> {
  try {
    const actor = await requireUser();
    const data = await coursesService.listCourses(makeCtx(actor), rawInput);
    return actionOk(data);
  } catch (e) {
    return actionFail(e);
  }
}

export async function createCourseAction(
  _prev: ActionResult<CourseDTO>,
  formData: FormData,
): Promise<ActionResult<CourseDTO>> {
  try {
    const actor = await requireUser();
    const raw = Object.fromEntries(formData.entries());
    const data = await coursesService.createCourse(makeCtx(actor), raw);
    return actionOk(data);
  } catch (e) {
    return actionFail(e);
  }
}

export async function updateCourseAction(
  id: string,
  rawInput: unknown,
): Promise<ActionResult<CourseDTO>> {
  try {
    const actor = await requireUser();
    const data = await coursesService.updateCourse(makeCtx(actor), id, rawInput);
    return actionOk(data);
  } catch (e) {
    return actionFail(e);
  }
}

export async function publishCourseAction(
  id: string,
  isPublished: boolean,
): Promise<ActionResult<CourseDTO>> {
  try {
    const actor = await requireUser();
    const data = await coursesService.setCoursePublished(makeCtx(actor), id, isPublished);
    return actionOk(data);
  } catch (e) {
    return actionFail(e);
  }
}

export async function deleteCourseAction(id: string): Promise<ActionResult<void>> {
  try {
    const actor = await requireUser();
    await coursesService.softDeleteCourse(makeCtx(actor), id);
    return actionOk(undefined);
  } catch (e) {
    return actionFail(e);
  }
}
