import { notFound } from "next/navigation";
import { requireRole, toActor } from "@/server/auth/session";
import { getCourseById } from "@/services/courses.service";
import { listLessons } from "@/services/lessons.service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { Plus, BookOpen, Eye, EyeOff } from "lucide-react";
import { PublishToggle } from "./publish-toggle";
import { LessonList } from "./lesson-list";
import { isAppError } from "@/services/errors";

export default async function InstructorCoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const user = await requireRole(["ADMIN", "INSTRUCTOR"]);

  let course;
  try {
    course = await getCourseById({ actor: toActor(user) }, courseId);
  } catch (e) {
    if (isAppError(e) && (e.status === 404 || e.status === 403)) notFound();
    throw e;
  }

  const lessons = await listLessons({ actor: toActor(user) }, courseId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{course.title}</h1>
            <Badge variant={course.isPublished ? "success" : "secondary"}>
              {course.isPublished ? "Published" : "Draft"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{course.description}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <PublishToggle courseId={course.id} isPublished={course.isPublished} />
          <Button asChild size="sm">
            <Link href={`/instructor/courses/${course.id}/lessons/new`}>
              <Plus className="mr-1 h-4 w-4" />
              Add lesson
            </Link>
          </Button>
        </div>
      </div>

      <Separator />

      <LessonList courseId={course.id} lessons={lessons} />
    </div>
  );
}
