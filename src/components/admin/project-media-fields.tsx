"use client";

import { useState } from "react";
import type { ProjectMediaItem, ProjectMediaKind } from "@/lib/project-media";

const inputClass =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-ring";

interface DraftItem {
  id: string;
  kind: ProjectMediaKind;
  url: string;
  alt: string;
  caption: string;
  label: string;
}

function newItem(): DraftItem {
  return {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : String(Date.now()),
    kind: "image",
    url: "",
    alt: "",
    caption: "",
    label: "",
  };
}

interface ProjectMediaFieldsProps {
  initial?: ProjectMediaItem[];
}

export default function ProjectMediaFields({
  initial = [],
}: ProjectMediaFieldsProps) {
  const [items, setItems] = useState<DraftItem[]>(() =>
    initial.length > 0
      ? initial.map((item) => ({
          id: `${item.kind}-${item.url}`,
          kind: item.kind,
          url: item.url,
          alt: item.alt ?? "",
          caption: item.caption ?? "",
          label: item.label ?? "",
        }))
      : [newItem()],
  );

  const payload = items
    .filter((item) => item.url.trim())
    .map((item) => ({
      kind: item.kind,
      url: item.url.trim(),
      alt: item.alt.trim() || undefined,
      caption: item.caption.trim() || undefined,
      label: item.label.trim() || undefined,
    }));

  return (
    <div className="mt-5">
      <input type="hidden" name="media" value={JSON.stringify(payload)} />
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-sm text-muted-foreground">
          Screenshots, diagrams, videos, and links
        </span>
        <button
          type="button"
          onClick={() => setItems((current) => [...current, newItem()])}
          className="font-mono text-xs text-primary transition-opacity hover:opacity-80"
        >
          Add item
        </button>
      </div>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
        YouTube, Vimeo, and direct video files are embedded. Images keep their
        original aspect ratio.
      </p>
      <div className="mt-3 flex flex-col gap-4">
        {items.map((item, index) => (
          <div
            key={item.id}
            className="rounded-md border border-border p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <label className="flex min-w-0 flex-1 flex-col gap-1.5 text-sm">
                <span className="text-muted-foreground">Type</span>
                <select
                  value={item.kind}
                  onChange={(event) => {
                    const kind = event.target.value as ProjectMediaKind;
                    setItems((current) =>
                      current.map((entry) =>
                        entry.id === item.id ? { ...entry, kind } : entry,
                      ),
                    );
                  }}
                  className={inputClass}
                >
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                  <option value="link">Link</option>
                </select>
              </label>
              {items.length > 1 || item.url ? (
                <button
                  type="button"
                  onClick={() =>
                    setItems((current) =>
                      current.length === 1
                        ? [newItem()]
                        : current.filter((entry) => entry.id !== item.id),
                    )
                  }
                  className="mt-6 shrink-0 font-mono text-xs text-destructive transition-opacity hover:opacity-80"
                >
                  Remove
                </button>
              ) : null}
            </div>
            <label className="mt-3 flex flex-col gap-1.5 text-sm">
              <span className="text-muted-foreground">URL</span>
              <input
                type="url"
                value={item.url}
                onChange={(event) =>
                  setItems((current) =>
                    current.map((entry) =>
                      entry.id === item.id
                        ? { ...entry, url: event.target.value }
                        : entry,
                    ),
                  )
                }
                placeholder={
                  item.kind === "image"
                    ? "https://…"
                    : item.kind === "video"
                      ? "https://youtube.com/watch?v=…"
                      : "https://…"
                }
                className={`${inputClass} font-mono`}
              />
            </label>
            {item.kind === "image" ? (
              <label className="mt-3 flex flex-col gap-1.5 text-sm">
                <span className="text-muted-foreground">Alt text</span>
                <input
                  value={item.alt}
                  onChange={(event) =>
                    setItems((current) =>
                      current.map((entry) =>
                        entry.id === item.id
                          ? { ...entry, alt: event.target.value }
                          : entry,
                      ),
                    )
                  }
                  className={inputClass}
                />
              </label>
            ) : null}
            {item.kind === "link" ? (
              <label className="mt-3 flex flex-col gap-1.5 text-sm">
                <span className="text-muted-foreground">Label</span>
                <input
                  value={item.label}
                  onChange={(event) =>
                    setItems((current) =>
                      current.map((entry) =>
                        entry.id === item.id
                          ? { ...entry, label: event.target.value }
                          : entry,
                      ),
                    )
                  }
                  className={inputClass}
                />
              </label>
            ) : (
              <label className="mt-3 flex flex-col gap-1.5 text-sm">
                <span className="text-muted-foreground">Caption</span>
                <input
                  value={item.caption}
                  onChange={(event) =>
                    setItems((current) =>
                      current.map((entry) =>
                        entry.id === item.id
                          ? { ...entry, caption: event.target.value }
                          : entry,
                      ),
                    )
                  }
                  className={inputClass}
                />
              </label>
            )}
            <p className="sr-only">Media item {index + 1}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
