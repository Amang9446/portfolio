"use client";

import { X } from "lucide-react";
import { useRef, useState } from "react";
import { MAX_TAGS_PER_POST, normalizeTags, tagSlug } from "@/lib/tags";

interface TagInputProps {
  name: string;
  value: string[];
  onChange: (tags: string[]) => void;
}

/**
 * Chip editor for post topics. Submits as a comma-separated hidden field,
 * which `parseTagsField` re-normalizes server-side — the client is a
 * convenience, never the validation boundary.
 */
export default function TagInput({ name, value, onChange }: TagInputProps) {
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const full = value.length >= MAX_TAGS_PER_POST;

  const commit = (raw: string) => {
    const next = normalizeTags([...value, raw]);
    if (next.length !== value.length) onChange(next);
    setDraft("");
  };

  const remove = (slug: string) =>
    onChange(value.filter((tag) => tagSlug(tag) !== slug));

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      // Enter would otherwise submit the whole post form.
      event.preventDefault();
      if (draft.trim()) commit(draft);
      return;
    }

    if (event.key === "Backspace" && !draft && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div className="flex flex-col gap-1.5 text-sm">
      <span className="flex items-baseline justify-between text-muted-foreground">
        <span>Topics</span>
        <span className="font-mono text-xs">
          {value.length}/{MAX_TAGS_PER_POST}
        </span>
      </span>

      <input type="hidden" name={name} value={value.join(", ")} />

      <div
        onClick={() => inputRef.current?.focus()}
        className="flex flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-2 py-2 focus-within:border-ring"
      >
        {value.map((tag) => (
          <span
            key={tagSlug(tag)}
            className="inline-flex items-center gap-1 rounded-md bg-secondary py-0.5 pr-1 pl-2 text-xs text-secondary-foreground"
          >
            {tag}
            <button
              type="button"
              onClick={() => remove(tagSlug(tag))}
              aria-label={`Remove ${tag}`}
              className="rounded p-0.5 text-muted-foreground transition-colors hover:text-destructive"
            >
              <X aria-hidden="true" className="h-3 w-3" />
            </button>
          </span>
        ))}

        <input
          ref={inputRef}
          value={draft}
          disabled={full}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          // Losing focus mid-word should keep the tag, not silently drop it.
          onBlur={() => draft.trim() && commit(draft)}
          placeholder={full ? "" : "Add a topic…"}
          aria-label="Add a topic"
          className="min-w-32 flex-1 bg-transparent px-1 py-0.5 text-sm outline-none disabled:cursor-not-allowed"
        />
      </div>

      <p className="text-xs text-muted-foreground">
        Enter or comma to add. Shown on the blog list and linked to
        <code className="mx-1 font-mono">/blog/tag/…</code>
        archive pages.
      </p>
    </div>
  );
}
