"use client";

import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <Button
      size="sm"
      variant="outline"
      className="border-amber-300 hover:bg-amber-50 dark:border-amber-800 dark:hover:bg-amber-900/20 text-xs"
      onClick={() => window.print()}
    >
      <Printer className="mr-1.5 h-3.5 w-3.5" />
      Save as PDF
    </Button>
  );
}
