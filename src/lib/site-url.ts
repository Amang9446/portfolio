/**
 * The site's public origin, used for canonical URLs, JSON-LD, the sitemap,
 * RSS, and social-preview links.
 *
 * Resolution order:
 *   1. NEXT_PUBLIC_SITE_URL    — set this; it is the only one that survives a
 *                                custom domain.
 *   2. Vercel's project URL    — exposed automatically, so a deploy that
 *                                forgot (1) is still self-consistent.
 *   3. http://localhost:3000   — local development, CI, and `npm run build`
 *                                on a fresh clone.
 *
 * Reaching (3) during a real deployment would publish localhost canonical
 * URLs — an SEO problem that is silent, slow to notice, and slow to undo. So
 * on Vercel that case throws and fails the build instead. Everywhere else it
 * is a normal, supported default.
 */
const LOCAL_SITE_URL = "http://localhost:3000";

function resolveSiteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return configured;

  // Vercel exposes the project's production domain automatically.
  const vercelUrl =
    process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercelUrl) {
    console.warn(
      "[site-url] NEXT_PUBLIC_SITE_URL is not set — falling back to the " +
        `Vercel project URL (${vercelUrl}). Set NEXT_PUBLIC_SITE_URL to your ` +
        "canonical domain.",
    );
    return `https://${vercelUrl}`;
  }

  if (process.env.VERCEL) {
    throw new Error(
      "NEXT_PUBLIC_SITE_URL is not set and no Vercel project URL is " +
        "available. Refusing to build: every canonical URL, the sitemap, and " +
        "the RSS feed would point at localhost. Set NEXT_PUBLIC_SITE_URL in " +
        "your Vercel project's environment variables.",
    );
  }

  if (process.env.NODE_ENV === "production") {
    console.warn(
      "[site-url] NEXT_PUBLIC_SITE_URL is not set — canonical URLs, the " +
        "sitemap, and RSS will point at localhost.",
    );
  }

  return LOCAL_SITE_URL;
}

export const siteUrl = new URL(resolveSiteUrl());

export function absoluteUrl(path: string) {
  return new URL(path, siteUrl).toString();
}
