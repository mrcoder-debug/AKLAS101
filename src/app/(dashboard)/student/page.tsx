import { requireRole, toActor } from "@/server/auth/session";
import { listCourses } from "@/services/courses.service";
import { getProgressForCourses } from "@/services/progress.service";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { BookOpen, ArrowRight, Trophy, CheckCircle2, GraduationCap } from "lucide-react";

export default async function StudentDashboard() {
  const user = await requireRole(["STUDENT"]);
  const ctx = { actor: toActor(user) };

  const { rows: courses } = await listCourses(ctx, { page: 1, pageSize: 100 });

  const progressMap =
    courses.length > 0
      ? await getProgressForCourses(ctx, courses.map((c) => c.id))
      : new Map();

  const totalLessons = [...progressMap.values()].reduce((s, p) => s + p.totalPublished, 0);
  const completedLessons = [...progressMap.values()].reduce((s, p) => s + p.completed, 0);
  const completedCourses = courses.filter((c) => {
    const p = progressMap.get(c.id);
    return p && p.totalPublished > 0 && p.percentage === 100;
  }).length;
  const overallPct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  // Up to 3 in-progress courses (not 100% and has some progress) first, then not-started
  const inProgress = courses
    .filter((c) => {
      const p = progressMap.get(c.id);
      return p && p.percentage > 0 && p.percentage < 100;
    })
    .slice(0, 3);

  const notStarted = courses
    .filter((c) => {
      const p = progressMap.get(c.id);
      return !p || p.percentage === 0;
    })
    .slice(0, 3 - inProgress.length);

  const featured = [...inProgress, ...notStarted];

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div className="rounded-xl p-6 gradient-primary text-white">
        <p className="text-white/70 text-sm font-medium uppercase tracking-wide">Welcome back</p>
        <h1 className="text-2xl font-bold mt-1">{user.name}</h1>
        <p className="text-white/80 text-sm mt-1">Keep up the great work!</p>
      </div>

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Enrolled Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{courses.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Courses Completed</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedCourses}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Lessons Done</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedLessons}</div>
            <p className="text-xs text-muted-foreground mt-1">of {totalLessons} total</p>
          </CardContent>
        </Card>
      </div>

      {/* Overall progress */}
      {totalLessons > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-primary" />
                Overall progress
              </CardTitle>
              <span className="text-sm font-semibold">{overallPct}%</span>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={overallPct} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {completedLessons} of {totalLessons} lessons completed
            </p>
          </CardContent>
        </Card>
      )}

      {/* Continue learning */}
      {featured.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Continue learning</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/student/courses">
                All courses <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((course) => {
              const prog = progressMap.get(course.id);
              const pct = prog?.percentage ?? 0;
              return (
                <Link key={course.id} href={`/student/courses/${course.slug}`}>
                  <Card className="cursor-pointer h-full transition-all hover:shadow-md hover:-translate-y-0.5">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm line-clamp-2 leading-snug">{course.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{prog?.completed ?? 0} / {prog?.totalPublished ?? 0} lessons</span>
                        <span>{pct}%</span>
                      </div>
                      <Progress value={pct} className="h-1.5" />
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {courses.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
            <BookOpen className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">You have no active enrollments yet.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
