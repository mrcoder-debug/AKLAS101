import { PenTool, Sparkles, TrendingUp, Trophy, Video, Shield } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const features: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: PenTool,
    title: "Course Builder",
    description: "Build rich courses with video, markdown, quizzes, and simulators — all in one intuitive editor.",
  },
  {
    icon: Sparkles,
    title: "AI Tutor",
    description: "Per-course AI tutor trained on your content answers student questions 24/7, instantly.",
  },
  {
    icon: TrendingUp,
    title: "Progress Tracking",
    description: "Granular completion tracking, quiz analytics, and learner performance dashboards.",
  },
  {
    icon: Trophy,
    title: "Gamification",
    description: "XP points, daily streaks, achievement badges, and leaderboards keep learners engaged.",
  },
  {
    icon: Video,
    title: "Live & Async",
    description: "Video lessons, live classes, and downloadable resources — sync and async in one place.",
  },
  {
    icon: Shield,
    title: "Closed Platform",
    description: "Admin-provisioned accounts only. Your people, your content, curated access — no leaks.",
  },
];

export function Features() {
  return (
    <section className="py-24 lg:py-32">
      <div className="container">
        {/* Section header */}
        <div className="mx-auto max-w-2xl text-center mb-16">
          <p className="text-sm font-medium text-primary uppercase tracking-widest mb-3">Platform capabilities</p>
          <h2 className="font-serif text-4xl font-normal leading-tight tracking-tight text-foreground lg:text-5xl">
            Everything your institution needs,{" "}
            <span className="gradient-text italic font-bold">nothing it doesn&apos;t.</span>
          </h2>
          <p className="mt-5 text-lg text-muted-foreground leading-relaxed">
            Purposefully scoped. No feature bloat, no noisy integrations — just the tools that drive real learning outcomes.
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="group relative rounded-2xl border border-border/60 bg-card p-6 transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:-translate-y-0.5"
              >
                {/* Hover glow */}
                <div className="absolute inset-0 rounded-2xl gradient-primary opacity-0 group-hover:opacity-[0.04] transition-opacity duration-300" />

                {/* Icon container */}
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl gradient-primary shadow-primary">
                  <Icon className="h-5 w-5 text-white" strokeWidth={1.75} />
                </div>

                <h3 className="text-base font-semibold text-foreground mb-1.5">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
