import { absoluteUrl } from "@/lib/site-url";

export const SOCIAL_IMAGE_SIZE = {
  width: 1200,
  height: 630,
} as const;

export function socialImageUrl(slug: string, version: string) {
  return absoluteUrl(
    `/api/og/blog/${encodeURIComponent(slug)}?v=${encodeURIComponent(version)}`,
  );
}
