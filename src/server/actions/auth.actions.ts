"use server";

import { signIn, signOut } from "@/server/auth";
import { loginSchema } from "@/schemas/auth.schema";
import type { ActionResult } from "@/server/api/response";
import { actionFail } from "@/server/api/response";
import { AuthError } from "next-auth";

export async function loginAction(
  _prev: ActionResult<void>,
  formData: FormData,
): Promise<ActionResult<void>> {
  const raw = { email: formData.get("email"), password: formData.get("password") };
  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: { code: "VALIDATION", message: "Invalid credentials", details: parsed.error.flatten() } };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
    return { ok: true, data: undefined };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: { code: "UNAUTHORIZED", message: "Invalid email or password" } };
    }
    return actionFail(err);
  }
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirect: false });
}
