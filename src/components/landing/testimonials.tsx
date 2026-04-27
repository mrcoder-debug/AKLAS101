const testimonials = [
  {
    initials: "SK",
    name: "Dr. Sarah K.",
    role: "Head of L&D, Meridian Health Group",
    quote:
      "We rolled out mandatory compliance training to 800 clinical staff in two weeks. The admin-provisioned model meant zero onboarding friction — they got their invite, set a password, and were learning on day one.",
  },
  {
    initials: "JM",
    name: "James M.",
    role: "CTO, Vantage Engineering",
    quote:
      "The AI tutor alone justified the investment. Our engineers ask questions mid-course and get answers grounded in our actual internal documentation. It's like having a senior engineer available 24/7.",
  },
  {
    initials: "AL",
    name: "Amara L.",
    role: "Director of Learning, Fortis University",
    quote:
      "Our completion rate went from 41% to 89% in one semester. The gamification system is not gimmicky — it's carefully designed and our students genuinely compete for the leaderboard.",
  },
];

export function Testimonials() {
  return (
    <section className="py-24 lg:py-32 overflow-hidden">
      <div className="container">
        {/* Section header */}
        <div className="mx-auto max-w-xl text-center mb-16">
          <p className="text-sm font-medium text-primary uppercase tracking-widest mb-3">Social proof</p>
          <h2 className="font-serif text-4xl font-normal leading-tight tracking-tight text-foreground lg:text-5xl">
            Trusted by institutions{" "}
            <span className="gradient-text italic font-bold">that take learning seriously.</span>
          </h2>
        </div>

        {/* Testimonial cards */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {testimonials.map((t, i) => (
            <figure
              key={t.name}
              className="relative flex flex-col rounded-2xl border border-border/60 bg-card p-7 transition-all duration-300 hover:border-primary/40 hover:shadow-lg"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              {/* Giant quotation mark */}
              <div
                className="absolute top-5 right-6 text-7xl font-serif leading-none gradient-text opacity-20 select-none pointer-events-none"
                aria-hidden="true"
              >
                &ldquo;
              </div>

              <blockquote className="relative flex-1">
                <p className="text-sm leading-relaxed text-foreground/80">{t.quote}</p>
              </blockquote>

              <figcaption className="mt-6 flex items-center gap-3 border-t border-border/50 pt-5">
                {/* Avatar initial */}
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full gradient-primary text-white text-xs font-bold shadow-primary">
                  {t.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
