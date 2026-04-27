"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { MoreHorizontal, RefreshCw, XCircle, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { resendInvitationAction, revokeInvitationAction } from "@/server/actions/invitations.actions";
import type { InvitationDTO } from "@/services/dto";

const statusConfig: Record<string, { label: string; icon: React.ElementType; className: string }> = {
  PENDING: { label: "Pending", icon: Clock, className: "bg-warning/10 text-warning border-warning/20" },
  ACCEPTED: { label: "Accepted", icon: CheckCircle2, className: "bg-success/10 text-success border-success/20" },
  REVOKED: { label: "Revoked", icon: XCircle, className: "bg-destructive/10 text-destructive border-destructive/20" },
  EXPIRED: { label: "Expired", icon: AlertCircle, className: "bg-muted text-muted-foreground border-border" },
};

const roleColors: Record<string, string> = {
  STUDENT: "bg-info/10 text-info border-info/20",
  INSTRUCTOR: "bg-success/10 text-success border-success/20",
  ADMIN: "bg-primary/10 text-primary border-primary/20",
};

interface Props {
  invitations: InvitationDTO[];
  total: number;
  page: number;
  totalPages: number;
}

export function InvitationsTable({ invitations, total, page, totalPages }: Props) {
  const [revokeTarget, setRevokeTarget] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleResend(id: string) {
    startTransition(async () => {
      const result = await resendInvitationAction(id);
      if (result.ok) toast.success("Invitation resent");
      else toast.error(result.error.message);
    });
  }

  function handleRevoke() {
    if (!revokeTarget) return;
    const id = revokeTarget;
    setRevokeTarget(null);
    startTransition(async () => {
      const result = await revokeInvitationAction(id);
      if (result.ok) toast.success("Invitation revoked");
      else toast.error(result.error.message);
    });
  }

  return (
    <>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-1">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Role</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Invited by</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Expires</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invitations.map((inv) => {
                const status = (statusConfig[inv.status] ?? statusConfig["PENDING"]) as { label: string; icon: React.ElementType; className: string };
                const StatusIcon = status.icon;
                return (
                  <tr key={inv.id} className="border-b border-border last:border-0 hover:bg-surface-1/50 transition-colors">
                    <td className="px-4 py-3 font-medium">{inv.email}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={`text-xs ${roleColors[inv.role] ?? ""}`}>
                        {inv.role.charAt(0) + inv.role.slice(1).toLowerCase()}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={`text-xs gap-1 ${status.className}`}>
                        <StatusIcon className="h-3 w-3" />
                        {status.label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{inv.invitedByName}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {inv.status === "ACCEPTED"
                        ? `Accepted ${formatDistanceToNow(new Date(inv.acceptedAt!), { addSuffix: true })}`
                        : formatDistanceToNow(new Date(inv.expiresAt), { addSuffix: true })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {(inv.status === "PENDING" || inv.status === "EXPIRED") && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7" disabled={isPending}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleResend(inv.id)}
                              className="gap-2 cursor-pointer"
                            >
                              <RefreshCw className="h-3.5 w-3.5" />
                              Resend invitation
                            </DropdownMenuItem>
                            {inv.status === "PENDING" && (
                              <DropdownMenuItem
                                onClick={() => setRevokeTarget(inv.id)}
                                className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                              >
                                <XCircle className="h-3.5 w-3.5" />
                                Revoke
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <p className="text-xs text-muted-foreground">
              {total} total invitation{total !== 1 ? "s" : ""}
            </p>
            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <a
                  key={p}
                  href={`?page=${p}`}
                  className={`flex h-7 w-7 items-center justify-center rounded text-xs ${
                    p === page
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

      <AlertDialog open={!!revokeTarget} onOpenChange={() => setRevokeTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke invitation?</AlertDialogTitle>
            <AlertDialogDescription>
              The invited user will no longer be able to use this link to activate their account.
              You can resend a new invitation at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRevoke} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Revoke
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
