"use client";

import { useRef } from "react";
import { useRafScrollEffect } from "@/components/ui/use-raf-scroll-effect";

interface ArticleReadingProgressProps {
  contentId: string;
}

export default function ArticleReadingProgress({
  contentId,
}: ArticleReadingProgressProps) {
  const progressBar = useRef<HTMLDivElement>(null);

  useRafScrollEffect(() => {
    const content = document.getElementById(contentId);
    if (!content || !progressBar.current) return;

    const contentTop = window.scrollY + content.getBoundingClientRect().top;
    const readableDistance = Math.max(
      content.scrollHeight - window.innerHeight * 0.65,
      1,
    );
    const nextProgress = (window.scrollY - contentTop) / readableDistance;
    // This is a per-frame visual update, not application state. Avoid a React
    // render/commit on every scroll frame just to change one transform.
    const progress = Math.min(1, Math.max(0, nextProgress));
    progressBar.current.style.transform = `scaleX(${progress})`;
  }, true);

  return (
    <div
      aria-hidden="true"
      className="no-print pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 bg-transparent"
    >
      <div
        ref={progressBar}
        className="h-full origin-left bg-primary will-change-transform"
        style={{ transform: "scaleX(0)" }}
      />
    </div>
  );
}
