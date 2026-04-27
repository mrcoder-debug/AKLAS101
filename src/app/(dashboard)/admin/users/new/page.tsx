import { requireRole } from "@/server/auth/session";
import { CreateUserForm } from "./create-user-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "New user — AKLAS LMS" };

export default async function NewUserPage() {
  await requireRole(["ADMIN"]);
  return (
    <div className="mx-auto max-w-lg space-y-4">
      <h1 className="text-2xl font-bold">Create user</h1>
      <CreateUserForm />
    </div>
  );
}
