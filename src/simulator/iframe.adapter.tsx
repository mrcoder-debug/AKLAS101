"use client";

import type { SimulatorConfig } from "./types";

// iframe-based adapter. The `src` in simulatorConfig is the URL to embed.
// The iframe is sandboxed; only allow-scripts and allow-same-origin are granted
// so the embedded page can run JS but cannot navigate or access forms.
export function IframeSimulator({ config }: { config: SimulatorConfig | null }) {
  const src = config?.src as string | undefined;
  if (!src) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
        No simulator URL configured for this lesson.
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-lg border">
      <iframe
        src={src}
        className="w-full"
        style={{ height: "600px" }}
        sandbox="allow-scripts allow-same-origin"
        loading="lazy"
        title="Interactive simulator"
      />
    </div>
  );
}
