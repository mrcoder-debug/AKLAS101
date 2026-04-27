"use client";

import { useState } from "react";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ForumReplyDTO } from "@/services/dto";
import { VoteButton } from "./vote-button";
import { ReplyForm } from "./reply-form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Trash2, MessageSquare } from "lucide-react";
import { cn } from "@/lib/cn";
import { deleteReplyAction, markAcceptedAction } from "@/server/actions/forums.actions";
import { formatDistanceToNow } from "date-fns";

interface ReplyCardProps {
  reply: ForumReplyDTO;
  threadId: string;
  actorId: string;
  canModerate: boolean;
  depth?: number;
}

function ReplyCard({ reply, threadId, actorId, canModerate, depth = 0 }: ReplyCardProps) {
  const [showReply, setShowReply] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    startTransition(async () => {
      await deleteReplyAction(reply.id);
      router.refresh();
    });
  }

  function handleMarkAccepted() {
    startTransition(async () => {
      await markAcceptedAction(reply.id);
      router.refresh();
    });
  }

  return (
    <div className={cn("space-y-3", depth > 0 && "ml-6 pl-4 border-l")}>
      <div className="space-y-2">
        <div className="flex items-start gap-3">
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm">{reply.authorName}</span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
              </span>
              {reply.isAccepted && (
                <Badge variant="secondary" className="text-xs gap-1 text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-400">
                  <CheckCircle2 className="h-3 w-3" /> Accepted Answer
                </Badge>
              )}
            </div>
            <p className="text-sm whitespace-pre-wrap">{reply.content}</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <VoteButton
            targetType="reply"
            targetId={reply.id}
            initialScore={reply.voteScore}
            initialMyVote={reply.myVote}
          />
          {depth === 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => setShowReply((v) => !v)}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Reply
            </Button>
          )}
          {canModerate && !reply.isAccepted && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1 text-green-700"
              disabled={isPending}
              onClick={handleMarkAccepted}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Mark Answer
            </Button>
          )}
          {(reply.authorId === actorId || canModerate) && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1 text-destructive"
              disabled={isPending}
              onClick={handleDelete}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </Button>
          )}
        </div>

        {showReply && (
          <div className="ml-8">
            <ReplyForm
              threadId={threadId}
              parentId={reply.id}
              onCancel={() => setShowReply(false)}
              placeholder={`Reply to ${reply.authorName}…`}
            />
          </div>
        )}
      </div>

      {reply.children.length > 0 && (
        <div className="space-y-3">
          {reply.children.map((child) => (
            <ReplyCard
              key={child.id}
              reply={child}
              threadId={threadId}
              actorId={actorId}
              canModerate={canModerate}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface ReplyTreeProps {
  replies: ForumReplyDTO[];
  threadId: string;
  actorId: string;
  canModerate: boolean;
}

export function ReplyTree({ replies, threadId, actorId, canModerate }: ReplyTreeProps) {
  if (replies.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-6">
        No replies yet. Be the first to respond!
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {replies.map((reply) => (
        <ReplyCard
          key={reply.id}
          reply={reply}
          threadId={threadId}
          actorId={actorId}
          canModerate={canModerate}
          depth={0}
        />
      ))}
    </div>
  );
}
