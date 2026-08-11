"use client";

import { Check, Copy, X } from "lucide-react";
import {
  isValidElement,
  useRef,
  type ComponentPropsWithoutRef,
} from "react";
import { useCopyFeedback } from "@/components/ui/use-copy-feedback";

type CodeBlockProps = ComponentPropsWithoutRef<"pre"> & {
  node?: unknown;
};

function codeLanguage(children: CodeBlockProps["children"]) {
  if (!isValidElement<{ className?: string }>(children)) return "Code";

  const language = children.props.className?.match(/language-([\w-]+)/)?.[1];
  if (!language) return "Code";

  const names: Record<string, string> = {
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
    ts: "TypeScript",
    tsx: "TSX",
    typescript: "TypeScript",
    xml: "XML",
  };

  return names[language.toLowerCase()] ?? language.toUpperCase();
}

export default function CodeBlock({
  children,
  className,
}: CodeBlockProps) {
  const codeRef = useRef<HTMLPreElement>(null);
  const { status, showCopied, showCopyError } = useCopyFeedback();

  const copyCode = async () => {
    const value = codeRef.current?.textContent;
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
        <span>{codeLanguage(children)}</span>
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
      </div>
      <pre ref={codeRef} className={className}>
        {children}
      </pre>
    </div>
  );
}
