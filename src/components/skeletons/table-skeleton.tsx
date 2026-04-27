import { Skeleton } from "@/components/ui/skeleton";

const COLS = [
  "w-40",   // name / email
  "w-24",   // role / status
  "w-28",   // date
  "w-20",   // actions
];

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-border bg-surface-1 px-4 py-3">
        {COLS.map((w, i) => (
          <Skeleton key={i} className={`h-4 ${w}`} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div
          key={rowIdx}
          className="flex items-center gap-4 border-b border-border px-4 py-3.5 last:border-0"
        >
          {/* First cell: avatar + text */}
          <div className="flex items-center gap-2.5 w-40">
            <Skeleton className="h-7 w-7 rounded-full shrink-0" />
            <Skeleton className="h-4 flex-1" />
          </div>
          {COLS.slice(1).map((w, colIdx) => (
            <Skeleton key={colIdx} className={`h-4 ${w}`} />
          ))}
        </div>
      ))}
    </div>
  );
}
