import { requireRole, toActor } from "@/server/auth/session";
import { listCourses } from "@/services/courses.service";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, BookOpen } from "lucide-react";

export default async function InstructorCoursesPage() {
  const user = await requireRole(["INSTRUCTOR"]);
  const result = await listCourses({ actor: toActor(user) }, { page: 1, pageSize: 50 });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Courses</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {result.total} course{result.total !== 1 ? "s" : ""} total
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/instructor/courses/new">
            <Plus className="mr-1 h-4 w-4" />
            New course
          </Link>
        </Button>
      </div>

      {result.rows.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-lg border border-dashed">
          <BookOpen className="h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No courses yet.</p>
          <Button asChild size="sm" variant="outline">
            <Link href="/instructor/courses/new">Create your first course</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {result.rows.map((course) => (
            <Link key={course.id} href={`/instructor/courses/${course.id}`}>
              <Card className="transition-shadow hover:shadow-md cursor-pointer h-full">
                <CardHeader className="flex flex-row items-start justify-between">
                  <CardTitle className="text-base line-clamp-2">{course.title}</CardTitle>
                  <Badge
                    variant={course.isPublished ? "success" : "secondary"}
                    className="ml-2 shrink-0"
                  >
                    {course.isPublished ? "Live" : "Draft"}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">{course.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
