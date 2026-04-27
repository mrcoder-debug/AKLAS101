"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { createThreadAction } from "@/server/actions/forums.actions";

interface ThreadFormProps {
  courseId: string;
  courseSlug: string;
}

export function ThreadForm({ courseId, courseSlug }: ThreadFormProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createThreadAction({ courseId, title, content });
      if (result.ok) {
        setTitle("");
        setContent("");
        setOpen(false);
        router.push(`/student/courses/${courseSlug}/forum/${result.data.id}`);
        router.refresh();
      } else {
        setError(result.error.message);
      }
    });
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}>Start a Discussion</Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="border rounded-lg p-4 space-y-3 bg-card">
      <h3 className="font-semibold text-sm">New Discussion</h3>
      <div className="space-y-1.5">
        <Label htmlFor="thread-title">Title</Label>
        <Input
          id="thread-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What's your question or topic?"
          required
          minLength={3}
          maxLength={200}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="thread-content">Details</Label>
        <Textarea
          id="thread-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Describe your question or share what you'd like to discuss..."
          required
          minLength={10}
          rows={4}
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Posting…" : "Post"}
        </Button>
      </div>
    </form>
  );
}
