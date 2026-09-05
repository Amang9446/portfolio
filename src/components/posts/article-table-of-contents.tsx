"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
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
  onNavigate?: (id: string) => void;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const list = listRef.current;
    const indicator = indicatorRef.current;
    if (!list || !indicator) return;

    const updateIndicator = () => {
      const activeLink = list.querySelector<HTMLAnchorElement>(
        'a[aria-current="location"]',
      );
      if (!activeLink || !list.getClientRects().length) {
        indicator.style.opacity = "0";
        return;
      }

      const linkBounds = activeLink.getBoundingClientRect();
      const listBounds = list.getBoundingClientRect();
      indicator.style.transform = `translateY(${linkBounds.top - listBounds.top}px)`;
      indicator.style.height = `${linkBounds.height}px`;
      indicator.style.opacity = "1";
    };

    updateIndicator();
    // Re-measure wrapped labels after resizing, font loading, or opening
    // mobile contents. Never scroll the list or the page to move the marker.
    const observer = new ResizeObserver(updateIndicator);
    observer.observe(list);
    list.querySelectorAll("a").forEach((link) => observer.observe(link));
    return () => observer.disconnect();
  }, [activeId]);

  return (
    <div ref={listRef} className="relative mt-4">
      <span
        ref={indicatorRef}
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-0 w-0.5 rounded-full bg-primary opacity-0 transition-[transform,height,opacity] duration-300 ease-out motion-reduce:transition-none"
      />
      <ol className="space-y-2.5 border-l border-border">
        {headings.map((heading) => (
          <li key={heading.id}>
            <a
              href={`#${heading.id}`}
              aria-current={activeId === heading.id ? "location" : undefined}
              onClick={() => onNavigate?.(heading.id)}
              className={`flex min-h-11 items-center rounded-r-md py-2 pr-2 text-sm leading-snug transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 motion-reduce:transition-none lg:min-h-0 lg:py-1 ${
                heading.level === 3 ? "pl-7" : "pl-4"
              } ${
                activeId === heading.id
                  ? "bg-primary/5 text-foreground"
                  : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
              }`}
            >
              {heading.label}
            </a>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function ArticleTableOfContents({
  headings,
}: ArticleTableOfContentsProps) {
  const [activeId, setActiveId] = useState("");
  const mobileDetails = useRef<HTMLDetailsElement>(null);
  const desktopContents = useRef<HTMLElement>(null);

  useEffect(() => {
    const contents = desktopContents.current;
    if (!contents || !activeId) return;

    const keepActiveSectionVisible = () => {
      if (!contents.clientHeight) return;
      const activeLink = contents.querySelector<HTMLAnchorElement>(
        'a[aria-current="location"]',
      );
      if (!activeLink) return;

      const viewport = contents.getBoundingClientRect();
      const link = activeLink.getBoundingClientRect();
      const inset = 24;
      if (
        link.top >= viewport.top + inset &&
        link.bottom <= viewport.bottom - inset
      )
        return;

      // Scroll only the sidebar. scrollIntoView would also move the article.
      contents.scrollTo({
        top:
          contents.scrollTop +
          link.top -
          viewport.top -
          (contents.clientHeight - link.height) / 2,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
      });
    };

    keepActiveSectionVisible();
    const observer = new ResizeObserver(keepActiveSectionVisible);
    observer.observe(contents);
    return () => observer.disconnect();
  }, [activeId]);

  useRafScrollEffect(() => {
    let nextId = "";
    const headingOffset = window.matchMedia("(min-width: 1024px)").matches
      ? 128
      : 184;

    for (const heading of headings) {
      const element = document.getElementById(heading.id);
      if (!element || element.getBoundingClientRect().top > headingOffset)
        break;
      nextId = heading.id;
    }

    setActiveId(nextId);
  }, true);

  const activeHeading = headings.find((heading) => heading.id === activeId);

  const navigateMobile = (id: string) => {
    mobileDetails.current?.removeAttribute("open");
    // Move keyboard focus out of the collapsed contents and into the article.
    document.getElementById(id)?.focus({ preventScroll: true });
  };

  if (headings.length < 2) return null;

  return (
    <>
      <details
        ref={mobileDetails}
        className="article-mobile-contents no-print group sticky top-[4.5rem] z-20 rounded-lg border border-border bg-background px-3 py-1 shadow-sm lg:hidden"
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            mobileDetails.current?.removeAttribute("open");
            mobileDetails.current?.querySelector("summary")?.focus();
          }
        }}
      >
        <summary className="flex min-h-11 cursor-pointer list-none items-center gap-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-primary [&::-webkit-details-marker]:hidden">
          <span className="shrink-0 font-medium">Contents</span>
          <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
            {activeHeading?.label ?? `${headings.length} sections`}
          </span>
          <ChevronDown
            aria-hidden="true"
            className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180"
          />
        </summary>
        <nav
          aria-label="Article sections"
          className="max-h-[50dvh] overflow-y-auto overscroll-contain pb-3"
        >
          <HeadingLinks
            headings={headings}
            activeId={activeId}
            onNavigate={navigateMobile}
          />
        </nav>
      </details>

      <aside
        className="no-print hidden lg:sticky lg:top-28 lg:col-start-2 lg:row-start-1 lg:block lg:self-start"
        aria-label="Table of contents"
      >
        <nav
          ref={desktopContents}
          className="max-h-[calc(100dvh-8rem)] overflow-y-auto overscroll-contain pr-2 pb-4"
        >
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">
            In this article
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {headings.length} sections
          </p>
          <HeadingLinks headings={headings} activeId={activeId} />
        </nav>
      </aside>
    </>
  );
}
