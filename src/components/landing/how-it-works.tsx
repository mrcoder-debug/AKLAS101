const steps = [
  {
    number: "01",
    title: "Institution onboarding",
    description:
      "Your organisation signs up and an admin account is provisioned. No self-service — every client is personally onboarded by our team.",
  },
  {
    number: "02",
    title: "Invite your learners",
    description:
      "Admins send personalised invitations to each learner. Recipients set their password and land directly in their curated course catalogue.",
  },
  {
    number: "03",
    title: "Learn, track, and certify",
    description:
      "Learners progress through courses at their own pace. Admins and instructors track completion, quiz scores, and issue certificates in real time.",
  },
];

export function HowItWorks() {
  return (
    <section className="py-24 lg:py-32 bg-surface-1">
      <div className="container">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-[1fr_2fr] lg:gap-20 items-start">
          {/* Left: sticky label */}
          <div className="lg:sticky lg:top-28">
            <p className="text-sm font-medium text-primary uppercase tracking-widest mb-4">How it works</p>
            <h2 className="font-serif text-4xl font-normal leading-tight tracking-tight text-foreground lg:text-5xl">
              Structured access.{" "}
              <span className="gradient-text italic font-bold">Intentional learning.</span>
            </h2>
            <p className="mt-5 text-muted-foreground leading-relaxed">
              AKLAS is not a marketplace. There is no public sign-up. Every learner is invited. Every course is curated. That&apos;s what makes it work.
            </p>
          </div>

          {/* Right: steps */}
          <ol className="space-y-8">
            {steps.map((step, i) => (
              <li key={step.number} className="relative flex gap-6 group">
                {/* Connector line */}
                {i < steps.length - 1 && (
                  <div className="absolute left-[19px] top-12 bottom-0 w-px bg-border/60" aria-hidden="true" />
                )}

                {/* Step number bubble */}
                <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border/80 bg-card text-sm font-bold gradient-text shadow-sm group-hover:border-primary/50 transition-colors">
                  {step.number}
                </div>

                <div className="pt-1.5 pb-8">
                  <h3 className="text-base font-semibold text-foreground mb-1.5">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-lg">{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
