/**
 * Hosts whose images may go through the Next.js image optimizer.
 *
 * This is the single source of truth: `next.config.ts` builds its
 * `images.remotePatterns` from it, and `post-cover.tsx` checks against it
 * before choosing `<Image>` over a plain `<img>`. Keeping one list means a
 * fork only has to add its own CDN in one place — and the Supabase host is
 * derived from the project URL rather than hardcoded.
 *
 * Imported by `next.config.ts`, so it must stay dependency-free.
 */

/** CDNs used by the default content. Add your own here. */
const STATIC_IMAGE_HOSTS = [
  "res.cloudinary.com",
  "pbs.twimg.com",
  "play-lh.googleusercontent.com",
] as const;

/** The Supabase Storage host backing the `media` bucket, if configured. */
export function supabaseImageHost(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!url) return null;

  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

export function optimizedImageHosts(): string[] {
  const supabaseHost = supabaseImageHost();
  return supabaseHost
    ? [...STATIC_IMAGE_HOSTS, supabaseHost]
    : [...STATIC_IMAGE_HOSTS];
}
