import Link from "next/link";
import { tagSlug } from "@/lib/tags";

interface TagListProps {
  tags: string[];
  /** Cap for dense contexts like post cards. */
  limit?: number;
  /**
   * Set false inside an existing link — PostCard wraps its whole body in one,
   * and nesting anchors is invalid.
   */
  linked?: boolean;
  className?: string;
}

const chipClass =
  "block rounded-full border border-border px-2.5 py-0.5 font-mono text-[0.7rem] tracking-wide text-muted-foreground";

/** Topic chips, linking to the tag archives unless nested inside a link. */
export default function TagList({
  tags,
  limit,
  linked = true,
  className = "",
}: TagListProps) {
  // Cached payloads written before `tags` existed have no such field.
  const all = tags ?? [];
  const shown = limit ? all.slice(0, limit) : all;
  if (shown.length === 0) return null;

  return (
    <ul className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      {shown.map((tag) => (
        <li key={tagSlug(tag)}>
          {linked ? (
            <Link
              href={`/blog/tag/${tagSlug(tag)}`}
              className={`${chipClass} transition-colors hover:border-primary/40 hover:text-primary`}
            >
              {tag}
            </Link>
          ) : (
            <span className={chipClass}>{tag}</span>
          )}
        </li>
      ))}
    </ul>
  );
}
