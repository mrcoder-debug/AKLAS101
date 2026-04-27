import { NextResponse } from "next/server";
import { requireUser, toActor } from "@/server/auth/session";
import { createInvitation } from "@/services/invitations.service";
import { bulkInviteSchema } from "@/schemas/invitation.schema";
import { UnauthorizedError, ForbiddenError } from "@/services/errors";

export async function POST(request: Request) {
  try {
    const actor = await requireUser();
    if (actor.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = bulkInviteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const ctx = { actor: toActor(actor) };
    const results: {
      processed: number;
      errors: Array<{ row: number; email: string; error: string }>;
    } = { processed: 0, errors: [] };

    for (let i = 0; i < parsed.data.rows.length; i++) {
      const row = parsed.data.rows[i]!;
      try {
        await createInvitation(ctx, row);
        results.processed++;
      } catch (err: unknown) {
        results.errors.push({
          row: i + 2,
          email: row.email,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    return NextResponse.json(results);
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (err instanceof ForbiddenError) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
