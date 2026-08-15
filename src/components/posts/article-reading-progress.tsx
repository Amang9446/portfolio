"use client";

import { useState } from "react";
import { useRafScrollEffect } from "@/components/ui/use-raf-scroll-effect";

interface ArticleReadingProgressProps {
  contentId: string;
}

export default function ArticleReadingProgress({
  contentId,
}: ArticleReadingProgressProps) {
  const [progress, setProgress] = useState(0);

  useRafScrollEffect(() => {
    const content = document.getElementById(contentId);
    if (!content) return;

    const contentTop = window.scrollY + content.getBoundingClientRect().top;
    const readableDistance = Math.max(
      content.scrollHeight - window.innerHeight * 0.65,
      1,
    );
    const nextProgress = (window.scrollY - contentTop) / readableDistance;
    setProgress(Math.min(1, Math.max(0, nextProgress)));
  }, true);

  return (
    <div
      aria-hidden="true"
      className="no-print pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 bg-transparent"
    >
      <div
        className="h-full origin-left bg-primary will-change-transform"
        style={{ transform: `scaleX(${progress})` }}
      />
    </div>
  );
}
