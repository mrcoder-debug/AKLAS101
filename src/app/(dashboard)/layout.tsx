import { requireUserOrRedirect, toActor } from "@/server/auth/session";
import { Sidebar } from "@/components/layout/sidebar";
import { Topnav } from "@/components/layout/topnav";
import { adminNav, instructorNav, studentNav } from "@/components/layout/nav-items";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUserOrRedirect();

  const navItems =
    user.role === "ADMIN"
      ? adminNav
      : user.role === "INSTRUCTOR"
        ? instructorNav
        : studentNav;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar items={navItems} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topnav user={user} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
