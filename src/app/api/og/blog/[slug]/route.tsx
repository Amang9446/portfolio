import { ImageResponse } from "next/og";
import sharp from "sharp";
import { optimizedImageHosts } from "@/lib/image-hosts";
import { getPostBySlug } from "@/lib/posts";
import { getSiteContent } from "@/lib/settings";
import { SOCIAL_IMAGE_SIZE } from "@/lib/social-image";

export const runtime = "nodejs";
export const revalidate = 60;

export const MAX_BANNER_BYTES = 10 * 1024 * 1024;
export const MAX_INPUT_PIXELS = 4096 * 4096;

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

const cacheControl =
  "public, max-age=0, s-maxage=60, stale-while-revalidate=86400";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const [post, site] = await Promise.all([
    getPostBySlug(slug),
    getSiteContent(),
  ]);

  if (!post) {
    return new Response("Post not found", { status: 404 });
  }

  const bannerUrl = getBannerUrl(
    post.meta?.ogImage?.trim() || post.cover_image_url.trim(),
  );
  const banner = await loadBanner(bannerUrl);

  if (banner) {
    const png = await sharp(banner, { limitInputPixels: MAX_INPUT_PIXELS })
      .resize(SOCIAL_IMAGE_SIZE.width, SOCIAL_IMAGE_SIZE.height, {
        fit: "cover",
        position: "centre",
      })
      .png({ compressionLevel: 9 })
      .toBuffer();

    return new Response(new Uint8Array(png), {
      headers: {
        "Cache-Control": cacheControl,
        "Content-Type": "image/png",
      },
    });
  }

  const response = new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        overflow: "hidden",
        background: "#f7f4ee",
        color: "#3b3632",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          border: "2px solid #ded7ce",
        }}
      >
        <div
          style={{
            width: 64,
            height: 6,
            display: "flex",
            borderRadius: 999,
            background: "#9a5c3f",
          }}
        />
        <div
          style={{
            display: "flex",
            maxWidth: 980,
            fontSize: 64,
            lineHeight: 1.08,
            fontWeight: 600,
            letterSpacing: "-2px",
          }}
        >
          {post.title}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 28,
            color: "#766f69",
          }}
        >
          {[site.metadata.author, site.hero.title].filter(Boolean).join(" · ")}
        </div>
      </div>
    </div>,
    SOCIAL_IMAGE_SIZE,
  );

  response.headers.set("Cache-Control", cacheControl);
  return response;
}
