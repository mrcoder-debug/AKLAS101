import { notFound } from "next/navigation";
import { requireRole, toActor } from "@/server/auth/session";
import { getThread } from "@/services/forums.service";
import { getCourseBySlug } from "@/services/courses.service";
import { isAppError } from "@/services/errors";
import { VoteButton } from "@/components/forum/vote-button";
import { ReplyTree } from "@/components/forum/reply-tree";
import { ReplyForm } from "@/components/forum/reply-form";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Pin, Lock, ChevronLeft, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { deleteThreadAction, pinThreadAction } from "@/server/actions/forums.actions";
import { Button } from "@/components/ui/button";

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ slug: string; threadId: string }>;
}) {
  const { slug, threadId } = await params;
  const user = await requireRole(["STUDENT", "INSTRUCTOR", "ADMIN"]);
  const ctx = { actor: toActor(user) };

  let course;
  try {
    course = await getCourseBySlug(ctx, slug);
  } catch (e) {
    if (isAppError(e) && (e.status === 404 || e.status === 403)) notFound();
    throw e;
  }

  let thread;
  try {
    thread = await getThread(ctx, threadId);
  } catch (e) {
    if (isAppError(e) && (e.status === 404 || e.status === 403)) notFound();
    throw e;
  }

  const canModerate = user.role === "ADMIN" || user.role === "INSTRUCTOR";
  const isAuthor = thread.authorId === user.id;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-2">
        <Link
          href={`/student/courses/${slug}/forum`}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Discussion
        </Link>
      </div>

      {/* Thread */}
      <div className="border rounded-lg bg-card p-5 space-y-4">
        <div className="flex items-start gap-4">
          <VoteButton
            targetType="thread"
            targetId={thread.id}
            initialScore={thread.voteScore}
            initialMyVote={thread.myVote}
          />
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              {thread.isPinned && <Pin className="h-4 w-4 text-primary shrink-0" />}
              {thread.isLocked && <Lock className="h-4 w-4 text-muted-foreground shrink-0" />}
              <h1 className="text-lg font-bold">{thread.title}</h1>
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <span>{thread.authorName}</span>
              <span>{formatDistanceToNow(new Date(thread.createdAt), { addSuffix: true })}</span>
            </div>
            <p className="text-sm whitespace-pre-wrap">{thread.content}</p>
          </div>
        </div>

        {/* Moderation actions */}
        {(canModerate || isAuthor) && (
          <div className="flex gap-2 pt-2 border-t flex-wrap">
            {canModerate && (
              <form
                action={async () => {
                  "use server";
                  await pinThreadAction(threadId, !thread.isPinned);
                }}
              >
                <Button type="submit" variant="ghost" size="sm" className="gap-1">
                  <Pin className="h-3.5 w-3.5" />
                  {thread.isPinned ? "Unpin" : "Pin"}
                </Button>
              </form>
            )}
            {(canModerate || isAuthor) && (
              <form
                action={async () => {
                  "use server";
                  await deleteThreadAction(threadId);
                }}
              >
                <Button type="submit" variant="ghost" size="sm" className="gap-1 text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </Button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Replies */}
      <div className="space-y-4">
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
          {thread.replies.length} {thread.replies.length === 1 ? "Reply" : "Replies"}
        </h2>

        <ReplyTree
          replies={thread.replies}
          threadId={thread.id}
          actorId={user.id}
          canModerate={canModerate}
        />
      </div>

      {/* Reply form (only if thread not locked) */}
      {!thread.isLocked && (
        <div className="border rounded-lg bg-card p-4 space-y-3">
          <h3 className="font-semibold text-sm">Add a Reply</h3>
          <ReplyForm threadId={thread.id} />
        </div>
      )}

      {thread.isLocked && (
        <p className="text-sm text-muted-foreground text-center py-4 border rounded-lg">
          This discussion is locked. No new replies can be added.
        </p>
      )}
    </div>
  );
}
