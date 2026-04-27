import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";

// Protected role-dispatch page. Middleware ensures only authenticated users
// reach this path. Login redirects here via callbackUrl=/dashboard.
export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "ADMIN") redirect("/admin");
  if (user.role === "INSTRUCTOR") redirect("/instructor");
  redirect("/student");
}
