import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Lock } from "lucide-react";

export function Hero() {
  return (
    <section className="relative min-h-[calc(100vh-4rem)] overflow-hidden flex items-center">

      {/* Atmospheric gradient backdrop */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-primary/8 blur-[120px]" />
        <div className="absolute top-1/2 -left-20 h-[400px] w-[400px] rounded-full bg-violet-500/6 blur-[100px]" />
        <div className="absolute -bottom-20 right-1/3 h-[300px] w-[300px] rounded-full bg-indigo-400/5 blur-[80px]" />
        {/* Subtle dot grid */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)`,
            backgroundSize: "28px 28px",
          }}
        />
      </div>

      <div className="container py-20 lg:py-28">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-[1fr_480px] lg:gap-12 xl:gap-20 items-center">

          {/* ── Left: Copy ── */}
          <div className="max-w-2xl animate-fade-in">
            {/* Eyebrow */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-surface-1 px-3 py-1.5 text-xs font-medium text-muted-foreground">
              <Lock className="h-3 w-3 text-primary" />
              Invitation-only learning platform
            </div>

            {/* Headline — editorial serif */}
            <h1 className="font-serif text-5xl font-normal leading-[1.05] tracking-tight text-foreground lg:text-6xl xl:text-7xl">
              Elevate every{" "}
              <span className="relative inline-block">
                <span className="gradient-text font-bold italic">mind</span>
                {/* Underline decoration */}
                <svg
                  className="absolute -bottom-2 left-0 w-full"
                  height="8"
                  viewBox="0 0 200 8"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M 2 6 Q 50 2 100 5 Q 150 8 198 4"
                    stroke="hsl(var(--primary))"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    opacity="0.6"
                    fill="none"
                  />
                </svg>
              </span>{" "}
              <br className="hidden sm:block" />
              in your organisation.
            </h1>

            <p className="mt-8 text-lg text-muted-foreground leading-relaxed max-w-xl">
              AKLAS is a curated, closed learning platform for institutions and enterprises.
              Every learner is invited. Every course is intentional. No open registration —
              just your people, learning at their best.
            </p>

            {/* CTAs */}
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Button
                asChild
                size="lg"
                className="gradient-primary shadow-primary text-white border-0 hover:opacity-90 gap-2 h-12 px-6"
              >
                <a href="mailto:admin@aklas.example.com">
                  Request Access
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
              <Button asChild variant="ghost" size="lg" className="h-12 px-6 text-muted-foreground hover:text-foreground">
                <Link href="/login">Sign In →</Link>
              </Button>
            </div>

            {/* Social proof micro-text */}
            <p className="mt-8 text-xs text-muted-foreground/70">
              Trusted by institutions across education, healthcare, and enterprise training.
            </p>
          </div>

          {/* ── Right: CSS UI Mockup ── */}
          <div className="relative hidden lg:flex justify-center items-center animate-fade-in" style={{ animationDelay: "0.15s" }}>
            {/* Outer glow */}
            <div className="absolute inset-0 gradient-primary opacity-10 rounded-3xl blur-3xl scale-95" />

            {/* Main card */}
            <div className="relative w-full max-w-[420px] rounded-2xl border border-border/60 bg-card shadow-lg overflow-hidden">
              {/* Card header bar */}
              <div className="flex items-center gap-1.5 px-4 py-3 border-b border-border/50 bg-surface-1">
                <div className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
                <div className="h-2.5 w-2.5 rounded-full bg-warning/60" />
                <div className="h-2.5 w-2.5 rounded-full bg-success/60" />
                <div className="mx-auto text-[10px] font-medium text-muted-foreground/60 tracking-wide">
                  Introduction to Machine Learning
                </div>
              </div>

              {/* Video placeholder */}
              <div className="relative h-44 gradient-primary flex items-center justify-center">
                {/* Play button */}
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm border border-white/30">
                  <div className="ml-0.5 h-0 w-0 border-y-[7px] border-l-[14px] border-y-transparent border-l-white" />
                </div>
                {/* Chapter marker */}
                <div className="absolute bottom-3 left-3 right-3">
                  <div className="flex items-center justify-between text-white/70 text-[10px] mb-1.5">
                    <span>Chapter 3 · Neural Networks</span>
                    <span>12:45 / 28:30</span>
                  </div>
                  <div className="h-1 rounded-full bg-white/20">
                    <div className="h-full w-[44%] rounded-full bg-white" />
                  </div>
                </div>
              </div>

              {/* Content area */}
              <div className="p-4 space-y-3">
                {/* Progress */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Course progress</span>
                  <span className="font-semibold text-primary">67%</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full w-[67%] rounded-full gradient-primary" />
                </div>

                {/* Lesson list */}
                <div className="space-y-1.5 pt-1">
                  {[
                    { title: "Introduction & Setup", done: true },
                    { title: "Linear Regression", done: true },
                    { title: "Neural Networks", active: true },
                    { title: "Convolutional NNs", done: false },
                  ].map((lesson) => (
                    <div
                      key={lesson.title}
                      className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs ${
                        lesson.active
                          ? "bg-primary/10 text-primary font-medium"
                          : lesson.done
                          ? "text-muted-foreground"
                          : "text-muted-foreground/50"
                      }`}
                    >
                      <div
                        className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${
                          lesson.done
                            ? "border-success bg-success/10"
                            : lesson.active
                            ? "border-primary gradient-primary"
                            : "border-border"
                        }`}
                      >
                        {lesson.done && (
                          <svg className="h-2 w-2 text-success" viewBox="0 0 10 10" fill="none">
                            <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                          </svg>
                        )}
                        {lesson.active && (
                          <div className="h-1.5 w-1.5 rounded-full bg-white" />
                        )}
                      </div>
                      {lesson.title}
                    </div>
                  ))}
                </div>

                {/* XP badge */}
                <div className="flex items-center justify-between pt-1 border-t border-border/50">
                  <div className="flex items-center gap-1.5">
                    <div className="flex h-5 w-5 items-center justify-center rounded gradient-primary text-white text-[9px] font-bold">★</div>
                    <span className="text-xs text-muted-foreground">1,240 XP · Level 8</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-warning">
                    <span>🔥</span>
                    <span className="font-semibold">14 day streak</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating badges */}
            <div
              className="absolute -top-4 -right-4 rounded-xl border border-border/60 bg-card px-3 py-2 shadow-md animate-bounce"
              style={{ animationDuration: "3s" }}
            >
              <p className="text-[10px] text-muted-foreground">Quiz completed</p>
              <p className="text-xs font-semibold text-success">+50 XP 🎉</p>
            </div>
            <div
              className="absolute -bottom-4 -left-4 rounded-xl border border-border/60 bg-card px-3 py-2 shadow-md animate-bounce"
              style={{ animationDuration: "4s", animationDelay: "1s" }}
            >
              <p className="text-[10px] text-muted-foreground">AI Tutor</p>
              <p className="text-xs font-semibold gradient-text">Ask anything →</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
