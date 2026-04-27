"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { publishCourseAction } from "@/server/actions/courses.actions";

export function PublishToggle({
  courseId,
  isPublished,
}: {
  courseId: string;
  isPublished: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      const result = await publishCourseAction(courseId, !isPublished);
      if (result.ok) {
        toast.success(isPublished ? "Course unpublished" : "Course published");
        router.refresh();
      } else {
        toast.error(result.error.message);
      }
    });
  }

  return (
    <Button variant="outline" size="sm" onClick={handleToggle} disabled={isPending}>
      {isPending ? (
        <Loader2 className="mr-1 h-4 w-4 animate-spin" />
      ) : isPublished ? (
        <EyeOff className="mr-1 h-4 w-4" />
      ) : (
        <Eye className="mr-1 h-4 w-4" />
      )}
      {isPublished ? "Unpublish" : "Publish"}
    </Button>
  );
}
