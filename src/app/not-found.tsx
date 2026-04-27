import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl gradient-primary shadow-primary">
        <FileQuestion className="h-10 w-10 text-white" />
      </div>
      <div className="space-y-2">
        <h1 className="text-5xl font-extrabold gradient-text">404</h1>
        <p className="text-lg font-semibold">Page not found</p>
        <p className="text-sm text-muted-foreground max-w-sm">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
      </div>
      <Button asChild className="gradient-primary shadow-primary">
        <Link href="/">Go home</Link>
      </Button>
    </div>
  );
}
