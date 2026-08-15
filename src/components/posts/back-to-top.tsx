"use client";

import { ArrowUp } from "lucide-react";
import { useState } from "react";
import { useRafScrollEffect } from "@/components/ui/use-raf-scroll-effect";

const SHOW_AFTER_PX = 700;

export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useRafScrollEffect(() => {
    setVisible(window.scrollY > SHOW_AFTER_PX);
  });

  const scrollToTop = () => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  };

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Back to top"
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      className={`no-print fixed right-6 bottom-6 z-40 inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background/90 text-muted-foreground shadow-sm backdrop-blur-sm transition-all duration-200 hover:bg-secondary hover:text-foreground ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"
      }`}
    >
      <ArrowUp aria-hidden="true" className="h-4 w-4" />
    </button>
  );
}
