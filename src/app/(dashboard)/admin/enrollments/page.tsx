import { requireRole, toActor } from "@/server/auth/session";
import { listEnrollmentsAdmin } from "@/services/enrollments.service";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Users, TrendingUp, BookOpen } from "lucide-react";

export default async function AdminEnrollmentsPage() {
  const user = await requireRole(["ADMIN"]);
  const ctx = { actor: toActor(user) };
  const { enrollments, stats } = await listEnrollmentsAdmin(ctx);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <GraduationCap className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Enrollments</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            All course enrollments across the platform
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {(
          [
            { label: "Total Enrollments", value: stats.total, icon: GraduationCap },
            { label: "In Progress", value: stats.active, icon: Users },
            { label: "Completed", value: stats.completed, icon: BookOpen },
            { label: "Completion Rate", value: `${stats.completionRate}%`, icon: TrendingUp },
          ] as const
        ).map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Column headers (desktop) */}
      {enrollments.length > 0 && (
        <div className="hidden sm:grid grid-cols-[1fr_1fr_auto_auto] gap-4 px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <span>Student</span>
          <span>Course</span>
          <span className="text-right">Progress</span>
          <span className="text-right">Status</span>
        </div>
      )}

      {/* Enrollment list */}
      {enrollments.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
            <GraduationCap className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No enrollments yet.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0 divide-y">
            {enrollments.map((e) => (
              <div
                key={e.id}
                className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto_auto] gap-2 sm:gap-4 px-4 py-3 items-center"
              >
                {/* Student */}
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{e.user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{e.user.email}</p>
                </div>

                {/* Course */}
                <div className="min-w-0">
                  <p className="text-sm line-clamp-1">{e.course.title}</p>
                  <p className="text-xs text-muted-foreground">
                    Enrolled{" "}
                    {new Intl.DateTimeFormat("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    }).format(new Date(e.enrolledAt))}
                  </p>
                </div>

                {/* Progress bar */}
                <div className="flex items-center gap-2 sm:w-36 justify-end">
                  <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${e.pct}%` }}
                    />
                  </div>
                  <span className="text-xs tabular-nums text-muted-foreground w-8 text-right">
                    {e.pct}%
                  </span>
                </div>

                {/* Status badge */}
                <div className="flex sm:justify-end sm:w-24">
                  {e.isComplete ? (
                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800 text-xs">
                      Completed
                    </Badge>
                  ) : e.status === "REVOKED" ? (
                    <Badge variant="destructive" className="text-xs">
                      Revoked
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      In Progress
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
