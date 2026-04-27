"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { createCourseSchema, type CreateCourseInput } from "@/schemas/course.schema";
import { createCourseAction } from "@/server/actions/courses.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import type { CourseDTO } from "@/services/dto";
import type { ActionResult } from "@/server/api/response";

const initial: ActionResult<CourseDTO> = { ok: false, error: { code: "", message: "" } };

export function CreateCourseForm({ instructorId }: { instructorId: string }) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(createCourseAction, initial);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateCourseInput>({
    resolver: zodResolver(createCourseSchema),
    defaultValues: { instructorId },
  });

  useEffect(() => {
    if (state.ok && state.data) {
      toast.success("Course created");
      router.push(`/instructor/courses/${state.data.id}`);
    } else if (!state.ok && state.error.message) {
      toast.error(state.error.message);
    }
  }, [state, router]);

  const onSubmit = handleSubmit((_, event) => {
    const form = event?.target as HTMLFormElement;
    if (form) formAction(new FormData(form));
  });

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={onSubmit} className="space-y-4">
          <input type="hidden" {...register("instructorId")} value={instructorId} />

          <div className="space-y-1">
            <Label htmlFor="title">Title</Label>
            <Input id="title" {...register("title")} placeholder="Introduction to Electronics" />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="slug">URL slug</Label>
            <Input id="slug" {...register("slug")} placeholder="intro-to-electronics" className="font-mono" />
            <p className="text-xs text-muted-foreground">Lowercase letters, digits, and dashes only.</p>
            {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" {...register("description")} rows={4} />
            {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create course
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
