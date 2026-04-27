"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, RotateCcw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import type { FlashcardDTO } from "@/services/dto";

interface FlashcardViewerProps {
  lessonId: string;
  initialFlashcards?: FlashcardDTO[];
}

export function FlashcardViewer({ lessonId, initialFlashcards }: FlashcardViewerProps) {
  const [cards, setCards] = useState<FlashcardDTO[]>(initialFlashcards ?? []);
  const [loading, setLoading] = useState(!initialFlashcards);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    if (initialFlashcards) return;
    fetch(`/api/v1/ai/flashcards/${lessonId}`)
      .then((r) => r.json())
      .then((body) => {
        if (body.success && Array.isArray(body.data)) setCards(body.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [lessonId, initialFlashcards]);

  const prev = useCallback(() => {
    setFlipped(false);
    setIndex((i) => (i > 0 ? i - 1 : cards.length - 1));
  }, [cards.length]);

  const next = useCallback(() => {
    setFlipped(false);
    setIndex((i) => (i < cards.length - 1 ? i + 1 : 0));
  }, [cards.length]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
      else if (e.key === " ") {
        e.preventDefault();
        setFlipped((f) => !f);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prev, next]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
        <p className="text-sm text-muted-foreground">No flashcards yet.</p>
        <p className="text-xs text-muted-foreground">
          Ask your instructor to generate flashcards for this lesson.
        </p>
      </div>
    );
  }

  const card = cards[index];
  if (!card) return null;

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <p className="text-xs text-muted-foreground">
        Card {index + 1} of {cards.length} — click card or press Space to flip
      </p>

      {/* Flip card */}
      <div
        className="perspective-1000 h-48 w-full max-w-lg cursor-pointer select-none"
        onClick={() => setFlipped((f) => !f)}
        role="button"
        tabIndex={0}
        aria-label={flipped ? "Showing answer — click to see question" : "Showing question — click to see answer"}
        onKeyDown={(e) => e.key === "Enter" && setFlipped((f) => !f)}
      >
        <div
          className={cn(
            "relative h-full w-full transition-transform duration-500",
            "[transform-style:preserve-3d]",
            flipped && "[transform:rotateY(180deg)]",
          )}
        >
          {/* Front */}
          <div className="absolute inset-0 flex items-center justify-center rounded-xl border bg-card p-6 text-center [backface-visibility:hidden]">
            <p className="text-base font-medium">{card.front}</p>
          </div>
          {/* Back */}
          <div className="absolute inset-0 flex items-center justify-center rounded-xl border bg-primary/5 p-6 text-center [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <p className="text-base">{card.back}</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={prev} aria-label="Previous card">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setIndex(0);
            setFlipped(false);
          }}
          aria-label="Restart"
        >
          <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
          Restart
        </Button>
        <Button variant="outline" size="icon" onClick={next} aria-label="Next card">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Progress dots */}
      <div className="flex gap-1.5">
        {cards.map((_, i) => (
          <button
            key={i}
            onClick={() => {
              setIndex(i);
              setFlipped(false);
            }}
            className={cn(
              "h-1.5 w-1.5 rounded-full transition-colors",
              i === index ? "bg-primary" : "bg-border",
            )}
            aria-label={`Go to card ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
