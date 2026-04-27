import { requireRole, toActor } from "@/server/auth/session";
import { listCertificates } from "@/services/certificate.service";
import { listCourses } from "@/services/courses.service";
import { getProgressForCourses } from "@/services/progress.service";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, ExternalLink, Lock, Share2 } from "lucide-react";
import { CopyCertLinkButton } from "./copy-cert-link-button";

export default async function CertificatesPage() {
  const user = await requireRole(["STUDENT"]);
  const ctx = { actor: toActor(user) };

  const [certs, { rows: courses }] = await Promise.all([
    listCertificates(ctx),
    listCourses(ctx, { page: 1, pageSize: 100 }),
  ]);

  const certsByCourseId = new Map(certs.map((c) => [c.course.id, c]));

  const progressMap =
    courses.length > 0
      ? await getProgressForCourses(ctx, courses.map((c) => c.id))
      : new Map();

  const inProgress = courses.filter((c) => {
    const p = progressMap.get(c.id);
    return !certsByCourseId.has(c.id) && (!p || p.percentage < 100);
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
          <GraduationCap className="h-6 w-6 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Certificates</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Complete all lessons in a course to earn your certificate
          </p>
        </div>
      </div>

      {/* Earned certificates */}
      {certs.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Earned &mdash; {certs.length}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {certs.map((cert) => (
              <div
                key={cert.id}
                className="group relative overflow-hidden rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-stone-50 dark:border-amber-900/40 dark:from-amber-950/20 dark:to-stone-950/30 p-5 transition-shadow hover:shadow-md hover:shadow-amber-100 dark:hover:shadow-amber-900/10"
              >
                {/* Gold accent bar */}
                <div className="absolute left-0 top-0 h-full w-1 rounded-l-xl bg-gradient-to-b from-amber-400 to-amber-600" />

                <div className="pl-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm leading-snug line-clamp-2 text-foreground">
                        {cert.course.title}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Issued{" "}
                        {new Intl.DateTimeFormat("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        }).format(new Date(cert.issuedAt))}
                      </p>
                    </div>
                    <Badge className="shrink-0 border-amber-300 bg-amber-100 text-amber-700 dark:border-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                      Completed
                    </Badge>
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <Button
                      asChild
                      size="sm"
                      className="h-8 bg-amber-600 hover:bg-amber-700 text-white text-xs"
                    >
                      <Link href={`/certificates/${cert.shareToken}`} target="_blank">
                        <ExternalLink className="mr-1.5 h-3 w-3" />
                        View Certificate
                      </Link>
                    </Button>
                    <CopyCertLinkButton shareToken={cert.shareToken} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* In-progress courses */}
      {inProgress.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            In Progress &mdash; {inProgress.length}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {inProgress.map((course) => {
              const p = progressMap.get(course.id);
              const pct = p?.percentage ?? 0;
              return (
                <div
                  key={course.id}
                  className="flex items-center gap-4 rounded-xl border bg-muted/30 p-4 opacity-60"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium line-clamp-1">{course.title}</p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-amber-400/60"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs tabular-nums text-muted-foreground">{pct}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Empty state */}
      {courses.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-amber-200 bg-amber-50/40 dark:border-amber-900/30 dark:bg-amber-950/10 py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
            <GraduationCap className="h-8 w-8 text-amber-500" />
          </div>
          <div>
            <p className="font-semibold text-foreground">No courses yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Enroll in a course to start working toward your first certificate.
            </p>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link href="/student/courses">Browse Courses</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
