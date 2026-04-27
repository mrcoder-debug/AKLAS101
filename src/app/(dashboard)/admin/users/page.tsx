import { requireRole, toActor } from "@/server/auth/session";
import { listUsers } from "@/services/users.service";
import { UsersTable } from "./users-table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";
import type { SearchParams } from "next/dist/server/request/search-params";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await requireRole(["ADMIN"]);
  const sp = await searchParams;

  const result = await listUsers({ actor: toActor(user) }, {
    page: sp.page ?? 1,
    pageSize: sp.pageSize ?? 20,
    sort: sp.sort,
    order: sp.order,
    q: sp.q,
    filters: {
      role: sp.role ?? undefined,
      isActive: sp.isActive === "false" ? false : sp.isActive === "true" ? true : undefined,
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Users</h1>
        <Button asChild size="sm">
          <Link href="/admin/users/new">
            <Plus className="mr-1 h-4 w-4" />
            New user
          </Link>
        </Button>
      </div>
      <UsersTable
        rows={result.rows}
        total={result.total}
        page={result.page}
        pageSize={result.pageSize}
      />
    </div>
  );
}
