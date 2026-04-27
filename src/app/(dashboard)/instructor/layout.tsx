import { requireRole } from "@/server/auth/session";

export default async function InstructorLayout({ children }: { children: React.ReactNode }) {
  await requireRole(["ADMIN", "INSTRUCTOR"]);
  return <>{children}</>;
}
