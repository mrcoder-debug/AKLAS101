import { validateToken } from "@/services/invitations.service";
import { ActivationForm } from "./activation-form";
import { InvitationExpiredCard } from "@/app/(public)/invitation-expired/invitation-expired-card";

export const metadata = { title: "Activate Account" };

interface Props {
  params: Promise<{ token: string }>;
}

export default async function ActivatePage({ params }: Props) {
  const { token } = await params;
  const invitation = await validateToken(token);

  if (!invitation) {
    return <InvitationExpiredCard />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Activate your account</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          You&apos;re joining as a{" "}
          <span className="font-medium text-foreground">
            {invitation.role.charAt(0) + invitation.role.slice(1).toLowerCase()}
          </span>{" "}
          on <span className="font-medium text-foreground">{invitation.email}</span>. Set your
          password to get started.
        </p>
      </div>
      <ActivationForm token={token} email={invitation.email} />
    </div>
  );
}
