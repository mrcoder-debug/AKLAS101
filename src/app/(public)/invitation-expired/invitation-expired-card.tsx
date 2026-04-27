import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function InvitationExpiredCard() {
  return (
    <Card>
      <CardContent className="pt-8 pb-8 text-center space-y-4">
        <div className="flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-7 w-7 text-destructive" />
          </div>
        </div>
        <div>
          <h2 className="text-lg font-semibold">Invitation expired or invalid</h2>
          <p className="text-sm text-muted-foreground mt-1.5 max-w-xs mx-auto leading-relaxed">
            This invitation link is no longer valid. It may have expired (72-hour limit),
            already been used, or been revoked.
          </p>
        </div>
        <div className="pt-2 space-y-2">
          <p className="text-xs text-muted-foreground">
            Contact your administrator to receive a new invitation.
          </p>
          <Button asChild variant="outline" size="sm">
            <Link href="/login">Back to Sign In</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
