import { notFound } from "next/navigation";
import { requireRole, toActor } from "@/server/auth/session";
import { getCourseBySlug } from "@/services/courses.service";
import { listLessons } from "@/services/lessons.service";
import { getCourseProgress } from "@/services/progress.service";
import { isAppError } from "@/services/errors";
import { LeaderboardWidget } from "@/components/gamification/leaderboard-widget";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, MessageSquare } from "lucide-react";

export default async function StudentCoursePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await requireRole(["STUDENT"]);
  const ctx = { actor: toActor(user) };

  let course;
  try {
    course = await getCourseBySlug(ctx, slug);
  } catch (e) {
    if (isAppError(e) && (e.status === 404 || e.status === 403)) notFound();
    throw e;
  }

  const [lessons, progress] = await Promise.all([
    listLessons(ctx, course.id),
    getCourseProgress(ctx, course.id),
  ]);

  const completedSet = new Set(progress.completedLessonIds);

  return (
    <div className="flex gap-6 items-start">
      {/* Main content */}
      <div className="flex-1 min-w-0 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{course.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{course.description}</p>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Overall progress</span>
            <span className="font-medium">{progress.percentage}%</span>
          </div>
          <Progress value={progress.percentage} className="h-2.5" />
          <p className="text-xs text-muted-foreground">
            {progress.completed} of {progress.totalPublished} lessons complete
          </p>
        </div>

        {/* Lessons */}
        <div className="space-y-2">
          {lessons.map((lesson) => {
            const isComplete = completedSet.has(lesson.id);
            return (
              <Link key={lesson.id} href={`/student/courses/${slug}/lessons/${lesson.id}`}>
                <Card className="cursor-pointer transition-shadow hover:shadow-sm">
                  <CardContent className="flex items-center gap-3 py-3 px-4">
                    <span className="text-sm text-muted-foreground font-mono w-6 shrink-0">
                      {lesson.order}
                    </span>
                    <span className="flex-1 text-sm font-medium">{lesson.title}</span>
                    <div className="flex gap-1 shrink-0">
                      {lesson.videoUrl && <Badge variant="outline" className="text-xs">Video</Badge>}
                      {lesson.simulatorKey && <Badge variant="outline" className="text-xs">Sim</Badge>}
                    </div>
                    {isComplete ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border border-muted-foreground/30 shrink-0" />
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Forum link */}
        <Link
          href={`/student/courses/${slug}/forum`}
          className="flex items-center gap-2 rounded-lg border bg-card px-4 py-3 text-sm font-medium hover:bg-accent transition-colors"
        >
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          Course Discussion
          <span className="ml-auto text-xs text-muted-foreground">Join the forum →</span>
        </Link>
      </div>

      {/* Sidebar */}
      <div className="w-64 shrink-0 space-y-4 hidden lg:block">
        <LeaderboardWidget ctx={ctx} limit={10} />
      </div>
    </div>
  );
}
