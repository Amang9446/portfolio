"use client";

/**
 * Last-resort boundary: catches failures in the root layout itself, which is
 * why it has to render its own <html>/<body> and cannot rely on the design
 * tokens in globals.css having loaded.
 *
 * Colours are inlined literals for the same reason. They still honour
 * prefers-color-scheme via the small stylesheet below, so the one page that
 * cannot use the design system does not become the one page that ignores the
 * reader's theme.
 */
const CSS = `
  :root {
    --ge-bg: #f7f4ee;
    --ge-fg: #3b3632;
    --ge-muted: #766f69;
    --ge-accent: #9a5c3f;
    --ge-on-accent: #f7f4ee;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --ge-bg: #1c1917;
      --ge-fg: #ede9e4;
      --ge-muted: #a8a29b;
      --ge-accent: #c4785a;
      --ge-on-accent: #1c1917;
    }
  }
`;

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <head>
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
      </head>
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          padding: "1.5rem",
          background: "var(--ge-bg)",
          color: "var(--ge-fg)",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        }}
      >
        <div style={{ maxWidth: "40rem", margin: "0 auto" }}>
          <p
            style={{
              margin: 0,
              fontSize: "0.75rem",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "var(--ge-accent)",
              fontFamily: "ui-monospace, SFMono-Regular, monospace",
            }}
          >
            Error
          </p>
          <h1
            style={{
              margin: "1rem 0 0",
              fontSize: "1.875rem",
              fontWeight: 600,
            }}
          >
            This site failed to load
          </h1>
          <p
            style={{
              marginTop: "1rem",
              color: "var(--ge-muted)",
              lineHeight: 1.6,
            }}
          >
            Something went wrong before the page could render. Reloading usually
            fixes it.
          </p>
          {error.digest && (
            <p
              style={{
                marginTop: "0.75rem",
                fontSize: "0.75rem",
                color: "var(--ge-muted)",
                fontFamily: "ui-monospace, SFMono-Regular, monospace",
              }}
            >
              Reference: {error.digest}
            </p>
          )}
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "2.5rem",
              padding: "0.625rem 1.25rem",
              fontSize: "0.875rem",
              fontWeight: 500,
              color: "var(--ge-on-accent)",
              background: "var(--ge-accent)",
              border: "none",
              borderRadius: "0.375rem",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
