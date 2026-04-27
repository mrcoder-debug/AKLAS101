export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary shadow-primary shrink-0">
            <span className="text-sm font-bold text-white leading-none">A</span>
          </div>
          <span className="text-lg font-bold tracking-tight">AKLAS Academy</span>
        </div>
        {children}
      </div>
    </div>
  );
}
