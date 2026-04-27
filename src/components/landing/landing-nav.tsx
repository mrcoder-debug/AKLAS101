import Link from "next/link";
import { Button } from "@/components/ui/button";

export function LandingNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg gradient-primary shadow-primary transition-transform group-hover:scale-105 shrink-0">
            <span className="text-xs font-bold text-white leading-none">A</span>
          </div>
          <div className="leading-none">
            <span className="text-sm font-bold tracking-tight text-foreground">AKLAS</span>
            <span className="block text-[10px] text-muted-foreground tracking-widest uppercase mt-0.5">
              Academy
            </span>
          </div>
        </Link>

        {/* Right actions — NO signup link */}
        <nav className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
            <Link href="/login">Sign In</Link>
          </Button>
          <Button asChild size="sm" className="gradient-primary shadow-primary text-white border-0 hover:opacity-90">
            <a href="mailto:admin@aklas.example.com">Request Access</a>
          </Button>
        </nav>
      </div>
    </header>
  );
}
