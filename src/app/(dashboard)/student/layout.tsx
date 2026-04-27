import { requireRole } from "@/server/auth/session";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  await requireRole(["ADMIN", "STUDENT"]);
  return <>{children}</>;
}
