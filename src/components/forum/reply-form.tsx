"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createReplyAction } from "@/server/actions/forums.actions";

interface ReplyFormProps {
  threadId: string;
  parentId?: string;
  onCancel?: () => void;
  placeholder?: string;
}

export function ReplyForm({ threadId, parentId, onCancel, placeholder }: ReplyFormProps) {
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createReplyAction({ threadId, content, parentId });
      if (result.ok) {
        setContent("");
        router.refresh();
        onCancel?.();
      } else {
        setError(result.error.message);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder ?? "Write a reply…"}
        required
        minLength={1}
        rows={3}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2 justify-end">
        {onCancel && (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Posting…" : "Reply"}
        </Button>
      </div>
    </form>
  );
}
