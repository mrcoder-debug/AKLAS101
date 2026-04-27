import Link from "next/link";
import { requireUserOrRedirect } from "@/server/auth/session";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { BulkInviteForm } from "./bulk-invite-form";

export const metadata = { title: "Bulk Invite" };

export default async function BulkInvitePage() {
  const user = await requireUserOrRedirect();
  if (user.role !== "ADMIN") redirect("/");

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon" className="h-8 w-8">
          <Link href="/admin/invitations">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bulk Invite</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Upload a CSV file to invite multiple users at once (max 200 rows)
          </p>
        </div>
      </div>
      <BulkInviteForm />
    </div>
  );
}
