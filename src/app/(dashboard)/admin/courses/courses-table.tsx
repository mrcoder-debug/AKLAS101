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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, EyeOff, Trash2 } from "lucide-react";
import { publishCourseAction, deleteCourseAction } from "@/server/actions/courses.actions";
import type { CourseDTO } from "@/services/dto";

interface CoursesTableProps {
  rows: CourseDTO[];
  total: number;
  page: number;
  pageSize: number;
}

export function CoursesTable({ rows, total, page, pageSize }: CoursesTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function mutate(fn: () => Promise<{ ok: boolean; error?: { message: string } }>) {
    startTransition(async () => {
      const result = await fn();
      if (result.ok) {
        toast.success("Done");
        router.refresh();
      } else {
        toast.error(result.error?.message ?? "Something went wrong");
      }
    });
  }

  const columns = [
    {
      key: "title",
      header: "Course",
      sortable: true,
      cell: (c: CourseDTO) => (
        <div>
          <p className="font-medium">{c.title}</p>
          <p className="text-xs text-muted-foreground font-mono">{c.slug}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (c: CourseDTO) =>
        c.isPublished ? (
          <Badge variant="success">Published</Badge>
        ) : (
          <Badge variant="secondary">Draft</Badge>
        ),
    },
    {
      key: "updatedAt",
      header: "Updated",
      sortable: true,
      cell: (c: CourseDTO) =>
        new Date(c.updatedAt).toLocaleDateString(undefined, { dateStyle: "medium" }),
    },
    {
      key: "actions",
      header: "",
      className: "w-12",
      cell: (c: CourseDTO) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" disabled={isPending}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => mutate(() => publishCourseAction(c.id, !c.isPublished))}
            >
              {c.isPublished ? (
                <><EyeOff className="mr-2 h-4 w-4" />Unpublish</>
              ) : (
                <><Eye className="mr-2 h-4 w-4" />Publish</>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => mutate(() => deleteCourseAction(c.id))}
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
      searchPlaceholder="Search courses…"
      emptyMessage="No courses found."
    />
  );
}
