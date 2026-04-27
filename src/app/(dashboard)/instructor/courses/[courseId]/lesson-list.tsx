"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GripVertical, MoreHorizontal, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { reorderLessonsAction, deleteLessonAction, publishLessonAction } from "@/server/actions/lessons.actions";
import type { LessonDTO } from "@/services/dto";
import { BookOpen } from "lucide-react";

interface LessonListProps {
  courseId: string;
  lessons: LessonDTO[];
}

export function LessonList({ courseId, lessons: initialLessons }: LessonListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [lessons, setLessons] = useState(initialLessons);
  const [dragging, setDragging] = useState<string | null>(null);

  function mutate(fn: () => Promise<{ ok: boolean; error?: { message: string } }>) {
    startTransition(async () => {
      const result = await fn();
      if (result.ok) {
        toast.success("Done");
        router.refresh();
      } else {
        toast.error(result.error?.message ?? "Something went wrong");
      }
    });
  }

  function handleDragStart(id: string) {
    setDragging(id);
  }

  function handleDrop(targetId: string) {
    if (!dragging || dragging === targetId) {
      setDragging(null);
      return;
    }
    const from = lessons.findIndex((l) => l.id === dragging);
    const to = lessons.findIndex((l) => l.id === targetId);
    if (from === -1 || to === -1) { setDragging(null); return; }

    const reordered = [...lessons];
    const [item] = reordered.splice(from, 1);
    if (item) reordered.splice(to, 0, item);
    setLessons(reordered);
    setDragging(null);

    startTransition(async () => {
      const result = await reorderLessonsAction({
        courseId,
        lessonIds: reordered.map((l) => l.id),
      });
      if (!result.ok) {
        toast.error(result.error.message);
        setLessons(initialLessons);
      }
    });
  }

  if (lessons.length === 0) {
    return (
      <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-lg border border-dashed">
        <BookOpen className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No lessons yet. Add your first lesson above.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {lessons.map((lesson) => (
        <div
          key={lesson.id}
          draggable
          onDragStart={() => handleDragStart(lesson.id)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => handleDrop(lesson.id)}
          className={`flex items-center gap-3 rounded-md border bg-card p-3 transition-opacity ${
            dragging === lesson.id ? "opacity-40" : ""
          }`}
        >
          <GripVertical className="h-4 w-4 cursor-grab text-muted-foreground shrink-0" />
          <span className="text-xs font-mono text-muted-foreground w-6 shrink-0">
            {lesson.order}
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{lesson.title}</p>
            <div className="flex gap-1 mt-0.5">
              {lesson.videoUrl && (
                <Badge variant="outline" className="text-xs">Video</Badge>
              )}
              {lesson.simulatorKey && (
                <Badge variant="outline" className="text-xs">Simulator</Badge>
              )}
            </div>
          </div>
          <Badge variant={lesson.isPublished ? "success" : "secondary"}>
            {lesson.isPublished ? "Live" : "Draft"}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" disabled={isPending}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/instructor/courses/${courseId}/lessons/${lesson.id}`}>
                  <Pencil className="mr-2 h-4 w-4" />Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => mutate(() => publishLessonAction(lesson.id, !lesson.isPublished))}
              >
                {lesson.isPublished ? (
                  <><EyeOff className="mr-2 h-4 w-4" />Unpublish</>
                ) : (
                  <><Eye className="mr-2 h-4 w-4" />Publish</>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => mutate(() => deleteLessonAction(lesson.id))}
              >
                <Trash2 className="mr-2 h-4 w-4" />Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ))}
    </div>
  );
}
