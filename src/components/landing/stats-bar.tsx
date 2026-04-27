export function StatsBar() {
  const stats = [
    { value: "340+", label: "Courses delivered" },
    { value: "12,000+", label: "Learners trained" },
    { value: "94%", label: "Completion rate" },
    { value: "60+", label: "Partner institutions" },
  ];

  return (
    <section className="border-y border-border/50 bg-surface-1">
      <div className="container py-8">
        <dl className="grid grid-cols-2 gap-y-6 lg:grid-cols-4 lg:gap-0 lg:divide-x lg:divide-border/50">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center gap-1 px-6 text-center">
              <dt className="text-3xl font-bold tracking-tight gradient-text">{stat.value}</dt>
              <dd className="text-sm text-muted-foreground">{stat.label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
