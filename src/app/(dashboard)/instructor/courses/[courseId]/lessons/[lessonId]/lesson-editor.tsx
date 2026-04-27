"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { updateLessonSchema } from "@/schemas/lesson.schema";
import { updateLessonAction } from "@/server/actions/lessons.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Loader2, Sparkles, Layers } from "lucide-react";
import type { LessonDTO } from "@/services/dto";
import type { z } from "zod";

type FormValues = z.infer<typeof updateLessonSchema>;

export function LessonEditor({ lesson }: { lesson: LessonDTO }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [generatingFlashcards, setGeneratingFlashcards] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(updateLessonSchema),
    defaultValues: {
      title: lesson.title,
      contentMd: lesson.contentMd,
      videoUrl: lesson.videoUrl ?? undefined,
      simulatorKey: lesson.simulatorKey ?? undefined,
    },
  });

  function onSubmit(data: FormValues) {
    startTransition(async () => {
      const result = await updateLessonAction(lesson.id, data);
      if (result.ok) {
        toast.success("Lesson saved");
        router.refresh();
      } else {
        toast.error(result.error.message);
      }
    });
  }

  async function handleGenerateSummary() {
    setGeneratingSummary(true);
    setSummary(null);
    try {
      const res = await fetch(`/api/v1/ai/summaries/${lesson.id}`, { method: "POST" });
      const body = await res.json();
      if (body.success) {
        setSummary(body.data.content);
        toast.success("AI summary generated");
      } else {
        toast.error(body.error?.message ?? "Failed to generate summary");
      }
    } catch {
      toast.error("Failed to generate summary");
    } finally {
      setGeneratingSummary(false);
    }
  }

  async function handleGenerateFlashcards() {
    setGeneratingFlashcards(true);
    try {
      const res = await fetch(`/api/v1/ai/flashcards/${lesson.id}`, { method: "POST" });
      const body = await res.json();
      if (body.success) {
        const count = Array.isArray(body.data) ? body.data.length : 0;
        toast.success(`${count} flashcard${count !== 1 ? "s" : ""} generated`);
        router.refresh();
      } else {
        toast.error(body.error?.message ?? "Failed to generate flashcards");
      }
    } catch {
      toast.error("Failed to generate flashcards");
    } finally {
      setGeneratingFlashcards(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1">
          <Label htmlFor="title">Title</Label>
          <Input id="title" {...register("title")} />
          {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
        </div>

        <div className="space-y-1">
          <Label htmlFor="contentMd">Content (Markdown)</Label>
          <Textarea id="contentMd" {...register("contentMd")} rows={12} className="font-mono text-sm" />
          {errors.contentMd && <p className="text-xs text-destructive">{errors.contentMd.message}</p>}
        </div>

        <div className="space-y-1">
          <Label htmlFor="videoUrl">Video URL (optional)</Label>
          <Input id="videoUrl" type="url" placeholder="https://youtube.com/embed/…" {...register("videoUrl")} />
          {errors.videoUrl && <p className="text-xs text-destructive">{errors.videoUrl.message}</p>}
        </div>

        <div className="space-y-1">
          <Label htmlFor="simulatorKey">Simulator key (optional)</Label>
          <Input id="simulatorKey" placeholder="wokwi" {...register("simulatorKey")} />
          <p className="text-xs text-muted-foreground">Use &quot;wokwi&quot; or &quot;tinkercad&quot; to embed an iframe simulator.</p>
          {errors.simulatorKey && <p className="text-xs text-destructive">{errors.simulatorKey.message}</p>}
        </div>

        <Button type="submit" disabled={isPending || !isDirty}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save lesson
        </Button>
      </form>

      <Separator />

      {/* AI content generation */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          AI Generation
        </h3>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateSummary}
            disabled={generatingSummary}
          >
            {generatingSummary ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            )}
            Generate AI Summary
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateFlashcards}
            disabled={generatingFlashcards}
          >
            {generatingFlashcards ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Layers className="mr-1.5 h-3.5 w-3.5" />
            )}
            Generate Flashcards
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          AI generation uses lesson content. Save the lesson first to include your latest edits.
        </p>

        {summary && (
          <div className="rounded-md border bg-muted/50 p-3 text-sm whitespace-pre-wrap">
            {summary}
          </div>
        )}
      </div>
    </div>
  );
}
