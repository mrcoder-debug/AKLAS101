"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DataTable } from "@/components/data-table/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, UserCheck, UserX, ShieldAlert, KeyRound, Trash2 } from "lucide-react";
import {
  setActiveAction,
  changeRoleAction,
  deleteUserAction,
} from "@/server/actions/users.actions";
import type { UserDTO } from "@/services/dto";

const roleColors: Record<string, "default" | "secondary" | "outline"> = {
  ADMIN: "default",
  INSTRUCTOR: "secondary",
  STUDENT: "outline",
};

interface UsersTableProps {
  rows: UserDTO[];
  total: number;
  page: number;
  pageSize: number;
}

export function UsersTable({ rows, total, page, pageSize }: UsersTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function mutate(fn: () => Promise<{ ok: boolean; error?: { message: string } }>) {
    startTransition(async () => {
      const result = await fn();
      if (result.ok) {
        toast.success("Updated");
        router.refresh();
      } else {
        toast.error(result.error?.message ?? "Something went wrong");
      }
    });
  }

  const columns = [
    {
      key: "name",
      header: "Name",
      sortable: true,
      cell: (u: UserDTO) => (
        <div>
          <p className="font-medium">{u.name}</p>
          <p className="text-xs text-muted-foreground">{u.email}</p>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      sortable: true,
      cell: (u: UserDTO) => (
        <Badge variant={roleColors[u.role] ?? "outline"}>{u.role}</Badge>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (u: UserDTO) =>
        u.isActive ? (
          <Badge variant="success">Active</Badge>
        ) : (
          <Badge variant="warning">Inactive</Badge>
        ),
    },
    {
      key: "createdAt",
      header: "Created",
      sortable: true,
      cell: (u: UserDTO) =>
        new Date(u.createdAt).toLocaleDateString(undefined, { dateStyle: "medium" }),
    },
    {
      key: "actions",
      header: "",
      className: "w-12",
      cell: (u: UserDTO) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" disabled={isPending}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() =>
                mutate(() => setActiveAction(u.id, !u.isActive))
              }
            >
              {u.isActive ? (
                <><UserX className="mr-2 h-4 w-4" />Deactivate</>
              ) : (
                <><UserCheck className="mr-2 h-4 w-4" />Activate</>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                mutate(() =>
                  changeRoleAction(
                    u.id,
                    u.role === "STUDENT"
                      ? "INSTRUCTOR"
                      : u.role === "INSTRUCTOR"
                        ? "ADMIN"
                        : "STUDENT",
                  ),
                )
              }
            >
              <ShieldAlert className="mr-2 h-4 w-4" />
              Cycle role
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => mutate(() => deleteUserAction(u.id))}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={rows}
      total={total}
      page={page}
      pageSize={pageSize}
      searchPlaceholder="Search users…"
      emptyMessage="No users found."
    />
  );
}
