"use client";

import { Check, Copy, WrapText, X } from "lucide-react";
import { useRef, useState, type ComponentPropsWithoutRef } from "react";
import { useCopyFeedback } from "@/components/ui/use-copy-feedback";

type CodeBlockProps = ComponentPropsWithoutRef<"pre"> & {
  language?: string;
};

const LANGUAGE_NAMES: Record<string, string> = {
  bash: "Shell",
  css: "CSS",
  html: "HTML",
  javascript: "JavaScript",
  js: "JavaScript",
  json: "JSON",
  jsx: "JSX",
  markdown: "Markdown",
  md: "Markdown",
  sql: "SQL",
  text: "Text",
  ts: "TypeScript",
  tsx: "TSX",
  typescript: "TypeScript",
  xml: "XML",
};

function codeLanguage(language: string | undefined) {
  if (!language) return "Code";
  return LANGUAGE_NAMES[language.toLowerCase()] ?? language.toUpperCase();
}

export default function CodeBlock({
  children,
  className,
  language,
  title,
}: CodeBlockProps) {
  const codeRef = useRef<HTMLPreElement>(null);
  const [wrapped, setWrapped] = useState(false);
  const { status, showCopied, showCopyError } = useCopyFeedback();

  const copyCode = async () => {
    const pre = codeRef.current;
    if (!pre) return;

    // rehype-code-lines wraps each line in its own element and drops the
    // newline text nodes, so textContent alone would run the lines together.
    const lines = pre.querySelectorAll(".code-line");
    const value = lines.length
      ? Array.from(lines, (line) => line.textContent ?? "").join("\n")
      : pre.textContent;
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value.replace(/\n$/, ""));
      showCopied();
    } catch (error) {
      console.error("Failed to copy code:", error);
      showCopyError();
    }
  };

  return (
    <div className="article-code-block">
      <div className="article-code-toolbar">
        {title ? (
          <span className="code-title">
            {title}
            <span className="code-title-language">
              {codeLanguage(language)}
            </span>
          </span>
        ) : (
          <span>{codeLanguage(language)}</span>
        )}
        <span className="inline-flex items-center gap-4">
          <button
            type="button"
            onClick={() => setWrapped((value) => !value)}
            aria-pressed={wrapped}
            title="Toggle line wrapping"
            className={`inline-flex items-center gap-1.5 transition-colors hover:text-foreground ${
              wrapped ? "text-primary" : ""
            }`}
          >
            <WrapText aria-hidden="true" className="h-3.5 w-3.5" />
            Wrap
          </button>
          <button
            type="button"
            onClick={copyCode}
            aria-live="polite"
            className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
          >
            {status === "copied" ? (
              <Check aria-hidden="true" className="h-3.5 w-3.5" />
            ) : status === "error" ? (
              <X aria-hidden="true" className="h-3.5 w-3.5" />
            ) : (
              <Copy aria-hidden="true" className="h-3.5 w-3.5" />
            )}
            {status === "copied"
              ? "Copied"
              : status === "error"
                ? "Copy failed"
                : "Copy"}
          </button>
        </span>
      </div>
      <pre
        ref={codeRef}
        className={`${className ?? ""} ${wrapped ? "code-wrap" : ""}`}
      >
        {children}
      </pre>
    </div>
  );
}
