import { requireUserOrRedirect, toActor } from "@/server/auth/session";
import { redirect } from "next/navigation";
import { listAuditLogs } from "@/services/audit.service";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ClipboardList } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export const metadata = { title: "Audit Log" };

const actionColors: Record<string, string> = {
  USER_CREATED: "bg-success/10 text-success border-success/20",
  USER_UPDATED: "bg-info/10 text-info border-info/20",
  USER_DEACTIVATED: "bg-warning/10 text-warning border-warning/20",
  USER_ACTIVATED: "bg-success/10 text-success border-success/20",
  USER_DELETED: "bg-destructive/10 text-destructive border-destructive/20",
  ROLE_CHANGED: "bg-primary/10 text-primary border-primary/20",
  INVITE_SENT: "bg-info/10 text-info border-info/20",
  INVITE_RESENT: "bg-info/10 text-info border-info/20",
  INVITE_REVOKED: "bg-warning/10 text-warning border-warning/20",
  INVITE_ACCEPTED: "bg-success/10 text-success border-success/20",
  USER_ENROLLED: "bg-primary/10 text-primary border-primary/20",
  USER_UNENROLLED: "bg-warning/10 text-warning border-warning/20",
  COURSE_PUBLISHED: "bg-success/10 text-success border-success/20",
  COURSE_DELETED: "bg-destructive/10 text-destructive border-destructive/20",
};

function formatAction(action: string): string {
  return action
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; action?: string }>;
}) {
  const user = await requireUserOrRedirect();
  if (user.role !== "ADMIN") redirect("/");
  const { page, action } = await searchParams;

  const ctx = { actor: toActor(user) };
  const result = await listAuditLogs(ctx, {
    page: Number(page ?? 1),
    pageSize: 25,
    action: action ?? undefined,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Audit Log</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Complete record of all administrative actions
        </p>
      </div>

      {result.rows.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          heading="No audit events yet"
          description="Administrative actions will appear here."
        />
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-1">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Time</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actor</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Action</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Target</th>
              </tr>
            </thead>
            <tbody>
              {result.rows.map((log) => (
                <tr
                  key={log.id}
                  className="border-b border-border last:border-0 hover:bg-surface-1/40 transition-colors"
                >
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-xs">{log.actorName}</div>
                    <div className="text-xs text-muted-foreground">{log.actorEmail}</div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant="outline"
                      className={`text-[11px] ${actionColors[log.action] ?? "bg-muted text-muted-foreground"}`}
                    >
                      {formatAction(log.action)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground font-mono">
                    {log.targetType} · {log.targetId.slice(0, 8)}…
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {result.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border px-4 py-3">
              <p className="text-xs text-muted-foreground">
                {result.total} total events
              </p>
              <div className="flex gap-1">
                {(Array.from({ length: result.totalPages }, (_, i) => i + 1) as number[]).map((p) => (
                  <a
                    key={p}
                    href={`?page=${p}`}
                    className={`flex h-7 w-7 items-center justify-center rounded text-xs ${
                      p === result.page
                        ? "gradient-primary text-white font-semibold"
                        : "hover:bg-accent text-muted-foreground"
                    }`}
                  >
                    {p}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
