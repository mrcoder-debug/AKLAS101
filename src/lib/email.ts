import { Resend } from "resend";
import { InviteEmail } from "@/emails/invite-email";

const FROM = process.env.FROM_EMAIL ?? "noreply@aklas.example.com";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function sendInviteEmail(opts: {
  to: string;
  token: string;
  inviterName: string;
  role: "INSTRUCTOR" | "STUDENT";
}): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY not set — skipping invite email");
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const activationUrl = `${APP_URL}/activate/${opts.token}`;

  const { error } = await resend.emails.send({
    from: `AKLAS Academy <${FROM}>`,
    to: [opts.to],
    subject: `You've been invited to AKLAS as ${opts.role === "INSTRUCTOR" ? "an Instructor" : "a Student"}`,
    react: InviteEmail({
      inviterName: opts.inviterName,
      role: opts.role,
      activationUrl,
      expiresInHours: 72,
    }),
  });

  if (error) {
    // Log but don't throw — invitation is created even if email fails.
    // Admin can resend from the invitations queue.
    console.error("[email] Failed to send invite email:", error);
  }
}
