"use client";

import { getAdapter } from "./registry";
import type { SimulatorConfig } from "./types";
import { AlertTriangle } from "lucide-react";

interface SimulatorHostProps {
  simulatorKey: string;
  simulatorConfig: unknown;
}

export function SimulatorHost({ simulatorKey, simulatorConfig }: SimulatorHostProps) {
  const adapter = getAdapter(simulatorKey);
  if (!adapter) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        Unknown simulator type &quot;{simulatorKey}&quot;
      </div>
    );
  }

  return <>{adapter.render(simulatorConfig as SimulatorConfig | null)}</>;
}
