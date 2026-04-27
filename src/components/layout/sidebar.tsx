"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  GraduationCap,
  Mail,
  ClipboardList,
  UserCircle,
  Settings,
  Award,
  BarChart3,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";
import type { NavItem } from "./nav-items";

const ICONS: Record<string, LucideIcon> = {
  LayoutDashboard,
  Users,
  BookOpen,
  GraduationCap,
  Mail,
  ClipboardList,
  UserCircle,
  Settings,
  Award,
  BarChart3,
};

interface SidebarProps {
  items: NavItem[];
}

export function Sidebar({ items }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="relative flex h-full w-60 shrink-0 flex-col border-r border-border bg-card">
      {/* Top gradient accent line */}
      <div className="absolute inset-x-0 top-0 h-[2px] gradient-primary rounded-none" />

      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg gradient-primary shadow-primary shrink-0">
          <span className="text-xs font-bold text-white leading-none">A</span>
        </div>
        <div className="leading-none">
          <span className="text-sm font-bold tracking-tight text-foreground">AKLAS</span>
          <span className="block text-[10px] text-muted-foreground tracking-widest uppercase mt-0.5">
            Academy
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-4 h-px bg-border" />

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 px-3 py-3">
        {items.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = ICONS[item.icon] ?? LayoutDashboard;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                isActive
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/60",
              )}
            >
              {/* Active background */}
              {isActive && (
                <span className="absolute inset-0 rounded-lg bg-accent/70 ring-1 ring-border" />
              )}
              {/* Active left accent bar */}
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-full gradient-primary" />
              )}

              <Icon
                className={cn(
                  "relative z-10 h-4 w-4 shrink-0 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
                )}
              />
              <span className={cn("relative z-10", isActive && "font-semibold gradient-text")}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Footer version tag */}
      <div className="mx-4 mb-4 mt-2 flex items-center justify-between rounded-lg bg-surface-1 px-3 py-2">
        <span className="text-[10px] font-medium text-muted-foreground tracking-wide">
          AKLAS LMS
        </span>
        <span className="text-[10px] text-muted-foreground/60">v2.0</span>
      </div>
    </aside>
  );
}
