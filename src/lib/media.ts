import { supabaseImageHost } from "@/lib/image-hosts";

/** Public URL prefix Supabase Storage serves the `media` bucket from. */
const BUCKET_PREFIX = "/storage/v1/object/public/media/";

/**
 * Inline images: `![alt](url)`, optionally `![alt](<url> "title")`.
 * The alt group tolerates one level of nested brackets (`![a [1] b](url)`).
 */
const INLINE_IMAGE = /!\[(?:[^[\]]|\[[^[\]]*\])*\]\(\s*<?([^)>\s]+)>?/g;
/** Reference definitions: `[ref]: url "title"` — the target of `![alt][ref]`. */
const LINK_DEFINITION = /^[ \t]*\[[^\]]+\]:[ \t]*<?([^>\s]+)>?/gm;

/**
 * Storage paths for every `media` object a post references — its banner plus
 * any images embedded in the body.
 *
 * Both the host and the bucket path must match this project's Storage, so an
 * image on another host (or another Supabase project that happens to use the
 * same URL shape) is never returned for deletion. When Supabase is not
 * configured there is nothing to delete, so the result is always empty.
 *
 * Reference-style images are collected via their link definitions. That
 * over-collects slightly — a definition used only by a plain link, not an
 * image, is included — but every candidate is still constrained to this
 * project's own `media` bucket, and missing a file orphans it forever whereas
 * including one only deletes an asset belonging to the post being deleted.
 */
export function postMediaPaths(post: {
  content: string;
  cover_image_url: string;
}): string[] {
  const expectedHost = supabaseImageHost();
  if (!expectedHost) return [];

  const paths = new Set<string>();

  const collect = (value: string) => {
    const url = value.trim();
    if (!url) return;
    try {
      const { host, pathname } = new URL(url);
      if (host !== expectedHost) return;
      if (!pathname.startsWith(BUCKET_PREFIX)) return;
      paths.add(decodeURIComponent(pathname.slice(BUCKET_PREFIX.length)));
    } catch {
      // Relative or malformed URLs are not storage objects.
    }
  };

  collect(post.cover_image_url);
  for (const pattern of [INLINE_IMAGE, LINK_DEFINITION]) {
    // Shared regex objects carry lastIndex between calls when global.
    pattern.lastIndex = 0;
    for (const match of post.content.matchAll(pattern)) collect(match[1]);
  }

  return [...paths];
}

/**
 * Filters out storage paths that are referenced by any other post, ensuring
 * deleting a post never breaks media shared with or embedded across other articles.
 */
export function filterOrphanedMediaPaths(
  targetPost: { content: string; cover_image_url: string },
  otherPosts: Array<{ content: string; cover_image_url: string }>,
): string[] {
  const candidatePaths = postMediaPaths(targetPost);
  if (candidatePaths.length === 0) return [];

  const otherReferencedPaths = new Set<string>();
  for (const other of otherPosts) {
    for (const p of postMediaPaths(other)) {
      otherReferencedPaths.add(p);
    }
  }

  return candidatePaths.filter((path) => !otherReferencedPaths.has(path));
}
