"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useEffect, useState } from "react";

interface ArticleLightboxProps {
  /** id of the rendered article body */
  contentId: string;
}

interface ZoomedImage {
  src: string;
  alt: string;
}

/**
 * Click-to-enlarge for article images — diagrams are unreadable at the
 * article's reading width.
 *
 * Mounted once per article. Rather than making every image its own client
 * component, this promotes the server-rendered <img>s to buttons on mount and
 * handles their clicks with a single delegated listener, so the cost stays
 * flat no matter how many images a post has.
 */
export default function ArticleLightbox({ contentId }: ArticleLightboxProps) {
  const [zoomed, setZoomed] = useState<ZoomedImage | null>(null);

  useEffect(() => {
    const content = document.getElementById(contentId);
    if (!content) return;

    // Images inside links keep their link behaviour; making them zoomable
    // would nest interactive content and swallow the navigation.
    const images = Array.from(
      content.querySelectorAll<HTMLImageElement>("img"),
    ).filter((image) => !image.closest("a"));

    for (const image of images) {
      image.classList.add("article-image-zoom");
      image.setAttribute("role", "button");
      image.setAttribute("tabindex", "0");
      image.setAttribute("aria-haspopup", "dialog");
    }

    const open = (image: HTMLImageElement) =>
      setZoomed({ src: image.currentSrc || image.src, alt: image.alt });

    const onClick = (event: MouseEvent) => {
      const image = (event.target as HTMLElement | null)?.closest?.(
        ".article-image-zoom",
      );
      if (image instanceof HTMLImageElement) open(image);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      const image = (event.target as HTMLElement | null)?.closest?.(
        ".article-image-zoom",
      );
      if (!(image instanceof HTMLImageElement)) return;
      event.preventDefault(); // Space would otherwise scroll the page
      open(image);
    };

    content.addEventListener("click", onClick);
    content.addEventListener("keydown", onKeyDown);

    return () => {
      content.removeEventListener("click", onClick);
      content.removeEventListener("keydown", onKeyDown);
      for (const image of images) {
        image.classList.remove("article-image-zoom");
        image.removeAttribute("role");
        image.removeAttribute("tabindex");
        image.removeAttribute("aria-haspopup");
      }
    };
  }, [contentId]);

  return (
    <Dialog.Root
      open={zoomed !== null}
      onOpenChange={(next) => !next && setZoomed(null)}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-background/85 backdrop-blur-[2px] data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content
          // The title already carries the alt text; there is nothing further to
          // describe, and Radix warns unless that is stated explicitly.
          aria-describedby={undefined}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 p-6 focus:outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0"
        >
          <Dialog.Title className="sr-only">
            {zoomed?.alt || "Enlarged image"}
          </Dialog.Title>

          {zoomed && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={zoomed.src}
              alt={zoomed.alt}
              className="max-h-[85vh] max-w-[95vw] rounded-lg border border-border object-contain shadow-2xl"
            />
          )}

          {zoomed?.alt && (
            <p
              // Same text as the dialog title above — shown, not re-announced.
              aria-hidden="true"
              className="max-w-[60ch] text-center font-mono text-xs tracking-wide text-muted-foreground"
            >
              {zoomed.alt}
            </p>
          )}

          <Dialog.Close
            aria-label="Close image"
            className="absolute top-5 right-5 rounded-md border border-border bg-card p-2 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
