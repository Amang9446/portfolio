"use client";

import { useRef, useState } from "react";
import { useRafScrollEffect } from "@/components/ui/use-raf-scroll-effect";
import type { ArticleHeading } from "@/lib/article-reading";

interface ArticleTableOfContentsProps {
  headings: ArticleHeading[];
}

function HeadingLinks({
  headings,
  activeId,
  onNavigate,
}: ArticleTableOfContentsProps & {
  activeId: string;
  onNavigate?: () => void;
}) {
  return (
    <ol className="mt-4 space-y-2.5 border-l border-border">
      {headings.map((heading) => (
        <li key={heading.id}>
          <a
            href={`#${heading.id}`}
            aria-current={activeId === heading.id ? "location" : undefined}
            onClick={onNavigate}
            className={`-ml-px block border-l py-0.5 text-sm leading-snug transition-colors ${
              heading.level === 3 ? "pl-7" : "pl-4"
            } ${
              activeId === heading.id
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {heading.label}
          </a>
        </li>
      ))}
    </ol>
  );
}

export default function ArticleTableOfContents({
  headings,
}: ArticleTableOfContentsProps) {
  const [activeId, setActiveId] = useState(headings[0]?.id ?? "");
  const mobileDetails = useRef<HTMLDetailsElement>(null);

  useRafScrollEffect(() => {
    let nextId = headings[0]?.id ?? "";

    for (const heading of headings) {
      const element = document.getElementById(heading.id);
      if (!element || element.getBoundingClientRect().top > 160) break;
      nextId = heading.id;
    }

    setActiveId(nextId);
  });

  if (headings.length < 2) return null;

  return (
    <>
      <details
        ref={mobileDetails}
        className="no-print rounded-lg border border-border bg-card p-4 lg:hidden"
      >
        <summary className="cursor-pointer font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">
          On this page
        </summary>
        <HeadingLinks
          headings={headings}
          activeId={activeId}
          onNavigate={() => mobileDetails.current?.removeAttribute("open")}
        />
      </details>

      <aside
        className="no-print hidden lg:col-start-2 lg:row-start-1 lg:block"
        aria-label="Table of contents"
      >
        <nav className="sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2 pb-4">
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">
            On this page
          </p>
          <HeadingLinks headings={headings} activeId={activeId} />
        </nav>
      </aside>
    </>
  );
}
