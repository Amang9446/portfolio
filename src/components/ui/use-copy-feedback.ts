"use client";

import { useEffect, useState } from "react";

const feedbackDuration = 1800;

export function useCopyFeedback() {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");

  useEffect(() => {
    if (status === "idle") return;
    const timer = window.setTimeout(() => setStatus("idle"), feedbackDuration);
    return () => window.clearTimeout(timer);
  }, [status]);

  return {
    status,
    showCopied: () => setStatus("copied"),
    showCopyError: () => setStatus("error"),
  };
}
