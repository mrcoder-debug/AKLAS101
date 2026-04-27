import Link from "next/link";
import { requireUserOrRedirect, toActor } from "@/server/auth/session";
import { redirect } from "next/navigation";
import { listInvitations } from "@/services/invitations.service";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { InvitationsTable } from "./invitations-table";
import { Mail, UserPlus, Upload } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata = { title: "Invitations" };

export default async function InvitationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>;
}) {
  const user = await requireUserOrRedirect();
  if (user.role !== "ADMIN") redirect("/");
  const { page, status } = await searchParams;

  const ctx = { actor: toActor(user) };
  const result = await listInvitations(ctx, {
    page: Number(page ?? 1),
    pageSize: 20,
    status: status ?? undefined,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Invitations</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage pending and past user invitations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/invitations/bulk">
              <Upload className="h-4 w-4" />
              Bulk Import
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/admin/invitations/new">
              <UserPlus className="h-4 w-4" />
              Invite User
            </Link>
          </Button>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 border-b border-border pb-0">
        {["all", "PENDING", "ACCEPTED", "REVOKED", "EXPIRED"].map((s) => {
          const isActive = (status ?? "all") === s;
          const href =
            s === "all" ? "/admin/invitations" : `/admin/invitations?status=${s}`;
          return (
            <Link
              key={s}
              href={href}
              className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {s === "all" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
            </Link>
          );
        })}
      </div>

      {/* Table */}
      {result.rows.length === 0 ? (
        <EmptyState
          icon={Mail}
          heading="No invitations yet"
          description="Invite users to give them access to the platform."
          action={{ label: "Invite User", href: "/admin/invitations/new" }}
        />
      ) : (
        <InvitationsTable
          invitations={result.rows}
          total={result.total}
          page={result.page}
          totalPages={result.totalPages}
        />
      )}
    </div>
  );
}
