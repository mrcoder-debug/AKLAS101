import { requireRole } from "@/server/auth/session";
import { CreateCourseForm } from "./create-course-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "New course — AKLAS LMS" };

export default async function NewCoursePage() {
  const user = await requireRole(["ADMIN", "INSTRUCTOR"]);
  return (
    <div className="mx-auto max-w-lg space-y-4">
      <h1 className="text-2xl font-bold">Create course</h1>
      <CreateCourseForm instructorId={user.id} />
    </div>
  );
}
