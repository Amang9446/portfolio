const DEFAULT_SITE_URL = "https://aman.is-a.dev";

export const siteUrl = new URL(
  process.env.NEXT_PUBLIC_SITE_URL?.trim() || DEFAULT_SITE_URL,
);

export function absoluteUrl(path: string) {
  return new URL(path, siteUrl).toString();
}
