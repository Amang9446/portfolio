"use client";

import { Check, Share2, X } from "lucide-react";
import { useCopyFeedback } from "@/components/ui/use-copy-feedback";

interface ArticleShareButtonProps {
  title: string;
  url: string;
}

export default function ArticleShareButton({
  title,
  url,
}: ArticleShareButtonProps) {
  const { status, showCopied, showCopyError } = useCopyFeedback();

  const shareArticle = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      showCopied();
    } catch (error) {
      console.error("Failed to share article:", error);
      showCopyError();
    }
  };

  return (
    <button
      type="button"
      onClick={shareArticle}
      aria-live="polite"
      className="inline-flex items-center gap-1.5 font-mono text-xs tracking-wide text-muted-foreground transition-colors hover:text-foreground"
    >
      {status === "copied" ? (
        <Check aria-hidden="true" className="h-3.5 w-3.5" />
      ) : status === "error" ? (
        <X aria-hidden="true" className="h-3.5 w-3.5" />
      ) : (
        <Share2 aria-hidden="true" className="h-3.5 w-3.5" />
      )}
      {status === "copied"
        ? "Link copied"
        : status === "error"
          ? "Share failed"
          : "Share"}
    </button>
  );
}
