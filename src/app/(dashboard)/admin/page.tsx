import { requireRole, toActor } from "@/server/auth/session";
import { getAdminStats } from "@/services/stats.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import {
  Users,
  BookOpen,
  GraduationCap,
  UserX,
  Mail,
  TrendingUp,
  ClipboardList,
  UserPlus,
  PlusCircle,
} from "lucide-react";

function formatAction(action: string): string {
  return action
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

export default async function AdminDashboard() {
  const user = await requireRole(["ADMIN"]);
  const stats = await getAdminStats({ actor: toActor(user) });

  const kpiRow1 = [
    { label: "Total Users", value: stats.userCount, icon: Users, href: "/admin/users" },
    { label: "Courses", value: stats.courseCount, icon: BookOpen, href: "/admin/courses" },
    {
      label: "Active Enrollments",
      value: stats.enrollmentCount,
      icon: GraduationCap,
      href: "/admin/enrollments",
    },
    {
      label: "Inactive Accounts",
      value: stats.inactiveUserCount,
      icon: UserX,
      href: "/admin/users?isActive=false",
      warn: stats.inactiveUserCount > 0,
    },
  ];

  const kpiRow2 = [
    {
      label: "Pending Invitations",
      value: stats.pendingInvitationCount,
      icon: Mail,
      href: "/admin/invitations",
      warn: stats.pendingInvitationCount > 0,
    },
    {
      label: "Platform Completion",
      value: `${stats.completionRate}%`,
      icon: TrendingUp,
      href: undefined,
    },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>

      {/* KPI row 1 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiRow1.map((c) => (
          <Card
            key={c.label}
            className={c.href ? "cursor-pointer hover:shadow-md transition-shadow" : ""}
          >
            {c.href ? (
              <Link href={c.href} className="block">
                <KpiCard {...c} />
              </Link>
            ) : (
              <KpiCard {...c} />
            )}
          </Card>
        ))}
      </div>

      {/* KPI row 2 */}
      <div className="grid gap-4 sm:grid-cols-2">
        {kpiRow2.map((c) => (
          <Card
            key={c.label}
            className={c.href ? "cursor-pointer hover:shadow-md transition-shadow" : ""}
          >
            {c.href ? (
              <Link href={c.href} className="block">
                <KpiCard {...c} />
              </Link>
            ) : (
              <KpiCard {...c} />
            )}
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent activity */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-primary" />
            Recent Activity
          </h2>
          {stats.recentAuditLogs.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                No activity yet.
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0 divide-y">
                {stats.recentAuditLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between px-4 py-3 gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">
                        <span className="font-medium">{log.actorName}</span>
                        {" — "}
                        <span className="text-muted-foreground">{formatAction(log.action)}</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(log.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0">
                      {log.targetType}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
          <div className="flex justify-end">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/audit">View all audit logs</Link>
            </Button>
          </div>
        </div>

        {/* Quick actions */}
        <div className="space-y-3">
          <h2 className="text-base font-semibold">Quick Actions</h2>
          <Card>
            <CardContent className="p-4 space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                <Link href="/admin/invitations/new">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Invite user
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                <Link href="/admin/users/new">
                  <Users className="mr-2 h-4 w-4" />
                  Create user directly
                </Link>
              </Button>
              <Separator />
              <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                <Link href="/admin/invitations">
                  <Mail className="mr-2 h-4 w-4" />
                  Manage invitations
                  {stats.pendingInvitationCount > 0 && (
                    <Badge className="ml-auto" variant="secondary">
                      {stats.pendingInvitationCount}
                    </Badge>
                  )}
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                <Link href="/admin/courses">
                  <BookOpen className="mr-2 h-4 w-4" />
                  Manage courses
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  icon: Icon,
  warn,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  warn?: boolean;
  href?: string;
}) {
  return (
    <>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className={`h-4 w-4 ${warn ? "text-destructive" : "text-muted-foreground"}`} />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${warn ? "text-destructive" : ""}`}>{value}</div>
      </CardContent>
    </>
  );
}
