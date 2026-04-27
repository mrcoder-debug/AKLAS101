import Link from "next/link";
import { requireUserOrRedirect } from "@/server/auth/session";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { InviteUserForm } from "./invite-user-form";

export const metadata = { title: "Invite User" };

export default async function InviteUserPage() {
  const user = await requireUserOrRedirect();
  if (user.role !== "ADMIN") redirect("/");

  return (
    <div className="max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon" className="h-8 w-8">
          <Link href="/admin/invitations">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Invite User</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Send a 72-hour activation link to a new user
          </p>
        </div>
      </div>
      <InviteUserForm />
    </div>
  );
}
