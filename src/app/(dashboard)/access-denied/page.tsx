import { auth } from "@/server/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";

export default async function AccessDeniedPage() {
  const session = await auth();
  const role = session?.user?.role;

  const homeHref =
    role === "ADMIN"
      ? "/admin"
      : role === "INSTRUCTOR"
        ? "/instructor"
        : "/student";

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
        <ShieldAlert className="h-8 w-8 text-destructive" />
      </div>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground max-w-sm">
          You don&apos;t have permission to view this page.
          {role && (
            <> Your current role is <strong>{role.charAt(0) + role.slice(1).toLowerCase()}</strong>.</>
          )}
        </p>
      </div>
      <Button asChild>
        <Link href={homeHref}>Go to dashboard</Link>
      </Button>
    </div>
  );
}
