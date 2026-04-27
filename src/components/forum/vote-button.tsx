"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";
import { voteThreadAction, voteReplyAction } from "@/server/actions/forums.actions";

interface VoteButtonProps {
  targetType: "thread" | "reply";
  targetId: string;
  initialScore: number;
  initialMyVote: number | null;
}

export function VoteButton({ targetType, targetId, initialScore, initialMyVote }: VoteButtonProps) {
  const [score, setScore] = useState(initialScore);
  const [myVote, setMyVote] = useState<number | null>(initialMyVote);
  const [isPending, startTransition] = useTransition();

  function handleVote(value: 1 | -1) {
    startTransition(async () => {
      const action = targetType === "thread" ? voteThreadAction : voteReplyAction;
      const result = await action(targetId, value);
      if (result.ok) {
        setScore(result.data.voteScore);
        setMyVote(result.data.myVote);
      }
    });
  }

  return (
    <div className="flex items-center gap-0.5">
      <Button
        variant="ghost"
        size="icon"
        className={cn("h-7 w-7", myVote === 1 && "text-primary")}
        disabled={isPending}
        onClick={() => handleVote(1)}
      >
        <ChevronUp className="h-4 w-4" />
      </Button>
      <span className={cn("text-sm font-medium w-5 text-center tabular-nums", myVote === 1 && "text-primary", myVote === -1 && "text-destructive")}>
        {score}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className={cn("h-7 w-7", myVote === -1 && "text-destructive")}
        disabled={isPending}
        onClick={() => handleVote(-1)}
      >
        <ChevronDown className="h-4 w-4" />
      </Button>
    </div>
  );
}
