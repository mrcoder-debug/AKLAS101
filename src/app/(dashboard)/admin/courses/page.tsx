import { requireRole, toActor } from "@/server/auth/session";
import { listCourses } from "@/services/courses.service";
import { CoursesTable } from "./courses-table";
import type { SearchParams } from "next/dist/server/request/search-params";

export default async function AdminCoursesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await requireRole(["ADMIN"]);
  const sp = await searchParams;

  const result = await listCourses({ actor: toActor(user) }, {
    page: sp.page ?? 1,
    pageSize: sp.pageSize ?? 20,
    sort: sp.sort,
    order: sp.order,
    q: sp.q,
    filters: {
      published:
        sp.published === "true" ? true : sp.published === "false" ? false : undefined,
    },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">All Courses</h1>
      <CoursesTable
        rows={result.rows}
        total={result.total}
        page={result.page}
        pageSize={result.pageSize}
      />
    </div>
  );
}
