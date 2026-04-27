import Link from "next/link";
import { Bell, Settings, UserCircle } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LogoutButton } from "./logout-button";
import type { AuthenticatedUser } from "@/server/auth/session";

const roleLabel: Record<string, string> = {
  ADMIN: "Admin",
  INSTRUCTOR: "Instructor",
  STUDENT: "Student",
};

const roleBadgeClass: Record<string, string> = {
  ADMIN: "bg-primary/10 text-primary border-primary/20",
  INSTRUCTOR: "bg-success/10 text-success border-success/20",
  STUDENT: "bg-info/10 text-info border-info/20",
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");
}

export function Topnav({ user }: { user: AuthenticatedUser }) {
  const initials = getInitials(user.name);

  return (
    <header className="flex h-14 items-center justify-between border-b border-border/60 bg-card/80 backdrop-blur-sm px-6 shrink-0">
      {/* Left: breadcrumb / page context (slot for pages to inject via portal — stubbed) */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">
          {roleLabel[user.role] ?? user.role} Portal
        </span>
      </div>

      {/* Right: actions + user menu */}
      <div className="flex items-center gap-1">
        {/* Theme toggle */}
        <ThemeToggle />

        {/* Notification bell (non-functional stub) */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
        </Button>

        {/* Divider */}
        <div className="mx-1.5 h-5 w-px bg-border" />

        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg p-1 pr-2 hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="text-[11px] font-semibold gradient-primary text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="hidden text-left sm:block">
              <p className="text-xs font-semibold leading-none text-foreground">{user.name}</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground leading-none truncate max-w-[120px]">
                {user.email}
              </p>
            </div>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel className="pb-2">
              <div className="flex items-center gap-2.5">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="text-sm font-semibold gradient-primary text-white">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
              </div>
              <Badge
                variant="outline"
                className={`mt-2 text-[10px] font-medium ${roleBadgeClass[user.role] ?? ""}`}
              >
                {roleLabel[user.role] ?? user.role}
              </Badge>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuItem asChild>
              <Link href="/profile" className="gap-2 cursor-pointer">
                <UserCircle className="h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings" className="gap-2 cursor-pointer">
                <Settings className="h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem asChild>
              <LogoutButton />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
