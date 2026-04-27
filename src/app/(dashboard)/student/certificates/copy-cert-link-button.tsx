"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Share2, Check } from "lucide-react";

export function CopyCertLinkButton({ shareToken }: { shareToken: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const url = `${window.location.origin}/certificates/${shareToken}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button
      size="sm"
      variant="outline"
      className="h-8 text-xs border-amber-300 hover:bg-amber-50 dark:border-amber-800 dark:hover:bg-amber-900/20"
      onClick={handleCopy}
    >
      {copied ? (
        <>
          <Check className="mr-1.5 h-3 w-3 text-green-600" />
          Copied!
        </>
      ) : (
        <>
          <Share2 className="mr-1.5 h-3 w-3" />
          Share
        </>
      )}
    </Button>
  );
}
