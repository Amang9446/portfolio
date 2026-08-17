"use client";

import Link from "next/link";
import { useEffect } from "react";

/**
 * Route-level error boundary. Deliberately does not read site settings — if
 * the CMS is what failed, this page still has to render.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Route error:", error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-start justify-center bg-background px-6 text-foreground">
      <div className="mx-auto w-full max-w-5xl">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">
          Error
        </p>
        <h1 className="mt-4 text-3xl font-semibold md:text-4xl">
          Something went wrong
        </h1>
        <p className="mt-4 max-w-prose text-muted-foreground">
          This page failed to load. Trying again often clears it — the content
          is served from a cache that refreshes every minute.
        </p>
        {error.digest && (
          <p className="mt-3 font-mono text-xs text-muted-foreground">
            Reference: {error.digest}
          </p>
        )}

        <div className="mt-10 flex items-center gap-4">
          <button
            type="button"
            onClick={reset}
            className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Try again
          </button>
          <Link
            href="/"
            className="rounded-md border border-border px-5 py-2.5 text-sm transition-colors hover:bg-secondary"
          >
            Back home
          </Link>
        </div>
      </div>
    </main>
  );
}
