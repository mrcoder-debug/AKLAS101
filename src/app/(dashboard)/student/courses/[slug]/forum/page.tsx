import { notFound } from "next/navigation";
import { requireRole, toActor } from "@/server/auth/session";
import { getCourseBySlug } from "@/services/courses.service";
import { listThreads } from "@/services/forums.service";
import { isAppError } from "@/services/errors";
import { ThreadForm } from "@/components/forum/thread-form";
import { VoteButton } from "@/components/forum/vote-button";
import Link from "next/link";
import { Pin, Lock, MessageSquare, ChevronLeft } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { ForumThreadDTO } from "@/services/dto";

export default async function ForumPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await requireRole(["STUDENT", "INSTRUCTOR", "ADMIN"]);
  const ctx = { actor: toActor(user) };

  let course;
  try {
    course = await getCourseBySlug(ctx, slug);
  } catch (e) {
    if (isAppError(e) && (e.status === 404 || e.status === 403)) notFound();
    throw e;
  }

  let threads: ForumThreadDTO[];
  try {
    threads = await listThreads(ctx, course.id);
  } catch {
    threads = [];
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-2">
        <Link
          href={`/student/courses/${slug}`}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          {course.title}
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Discussion</h1>
        <ThreadForm courseId={course.id} courseSlug={slug} />
      </div>

      {threads.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-12">
          No discussions yet. Start the first one!
        </p>
      ) : (
        <div className="divide-y border rounded-lg bg-card">
          {threads.map((thread) => (
            <div key={thread.id} className="flex gap-3 p-4">
              <div className="pt-0.5">
                <VoteButton
                  targetType="thread"
                  targetId={thread.id}
                  initialScore={thread.voteScore}
                  initialMyVote={thread.myVote}
                />
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {thread.isPinned && (
                    <Pin className="h-3.5 w-3.5 text-primary shrink-0" />
                  )}
                  {thread.isLocked && (
                    <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  )}
                  <Link
                    href={`/student/courses/${slug}/forum/${thread.id}`}
                    className="font-semibold text-sm hover:underline line-clamp-1"
                  >
                    {thread.title}
                  </Link>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{thread.content}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{thread.authorName}</span>
                  <span>{formatDistanceToNow(new Date(thread.updatedAt), { addSuffix: true })}</span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    {thread.replyCount}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
