import { requireRole, toActor } from "@/server/auth/session";
import { listCourses } from "@/services/courses.service";
import { getProgressForCourses } from "@/services/progress.service";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { BookOpen, CheckCircle2 } from "lucide-react";

export default async function StudentCoursesPage() {
  const user = await requireRole(["STUDENT"]);
  const ctx = { actor: toActor(user) };

  const { rows: courses } = await listCourses(ctx, { page: 1, pageSize: 100 });
  const progressMap =
    courses.length > 0
      ? await getProgressForCourses(ctx, courses.map((c) => c.id))
      : new Map();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Courses</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {courses.length} course{courses.length !== 1 ? "s" : ""} enrolled
        </p>
      </div>

      {courses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          heading="No courses yet"
          description="Your administrator will enroll you in courses."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => {
            const prog = progressMap.get(course.id);
            const pct = prog?.percentage ?? 0;
            const isComplete = pct === 100 && (prog?.totalPublished ?? 0) > 0;
            return (
              <Link key={course.id} href={`/student/courses/${course.slug}`}>
                <Card className="cursor-pointer h-full transition-all hover:shadow-md hover:-translate-y-0.5">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base line-clamp-2 leading-snug">
                        {course.title}
                      </CardTitle>
                      {isComplete && (
                        <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {course.description}
                    </p>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>
                          {prog?.completed ?? 0} / {prog?.totalPublished ?? 0} lessons
                        </span>
                        <span className="font-medium">{pct}%</span>
                      </div>
                      <Progress value={pct} className="h-1.5" />
                    </div>
                    {isComplete && (
                      <Badge variant="outline" className="text-xs border-success/40 text-success bg-success/5">
                        Completed
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
