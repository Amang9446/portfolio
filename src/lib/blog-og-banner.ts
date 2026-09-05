import { optimizedImageHosts } from "@/lib/image-hosts";

export const MAX_BANNER_BYTES = 10 * 1024 * 1024;

export function getBannerUrl(value: string | undefined): string | null {
  if (!value) return null;

  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return null;
    const allowedHosts = new Set(optimizedImageHosts());
    if (!allowedHosts.has(url.hostname)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export async function loadBanner(url: string | null) {
  if (!url) return null;

  try {
    const response = await fetch(url, {
      next: { revalidate: 60 },
      redirect: "error",
      signal: AbortSignal.timeout(5000),
    });
    const contentType = response.headers.get("content-type") ?? "";
    if (!response.ok || !contentType.startsWith("image/")) return null;

    const contentLength = Number(response.headers.get("content-length"));
    if (Number.isFinite(contentLength) && contentLength > MAX_BANNER_BYTES) {
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    if (arrayBuffer.byteLength > MAX_BANNER_BYTES) return null;

    return Buffer.from(arrayBuffer);
  } catch {
    return null;
  }
}
