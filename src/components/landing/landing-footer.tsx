import Link from "next/link";

export function LandingFooter() {
  return (
    <footer className="border-t border-border/50 bg-surface-1">
      <div className="container py-10">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg gradient-primary shadow-primary transition-transform group-hover:scale-105 shrink-0">
              <span className="text-xs font-bold text-white leading-none">A</span>
            </div>
            <div className="leading-none">
              <span className="text-sm font-bold tracking-tight text-foreground">AKLAS</span>
              <span className="block text-[10px] text-muted-foreground tracking-widest uppercase mt-0.5">Academy</span>
            </div>
          </Link>

          {/* Links */}
          <nav className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/login" className="hover:text-foreground transition-colors">
              Sign In
            </Link>
            <a href="mailto:admin@aklas.example.com" className="hover:text-foreground transition-colors">
              Contact
            </a>
          </nav>

          {/* Copyright */}
          <p className="text-xs text-muted-foreground/60">
            &copy; {new Date().getFullYear()} AKLAS Academy. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
