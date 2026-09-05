"use client";

import { Check, Copy, X } from "lucide-react";
import { useCopyFeedback } from "./use-copy-feedback";

export default function CopyEmailButton({ email }: { email: string }) {
  const { status, showCopied, showCopyError } = useCopyFeedback();

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(email);
      showCopied();
    } catch {
      showCopyError();
    }
  };

  return (
    <span className="inline-flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={copyEmail}
        aria-label="Copy email address"
        className="inline-flex h-11 items-center gap-2 rounded-md border border-border px-3 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
      >
        {status === "copied" ? (
          <Check aria-hidden="true" className="h-3.5 w-3.5" />
        ) : status === "error" ? (
          <X aria-hidden="true" className="h-3.5 w-3.5" />
        ) : (
          <Copy aria-hidden="true" className="h-3.5 w-3.5" />
        )}
        Copy
      </button>
      <span role="status" className="text-sm text-muted-foreground">
        {status === "copied"
          ? "Email copied"
          : status === "error"
            ? "Couldn’t copy. Select the email to copy it."
            : ""}
      </span>
    </span>
  );
}
