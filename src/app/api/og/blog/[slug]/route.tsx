import { ImageResponse } from "next/og";
import sharp from "sharp";
import { getBannerUrl, loadBanner } from "@/lib/blog-og-banner";
import { getPostBySlug } from "@/lib/posts";
import { getSiteContent } from "@/lib/settings";
import { SOCIAL_IMAGE_SIZE } from "@/lib/social-image";

export const runtime = "nodejs";
export const revalidate = 60;

const MAX_INPUT_PIXELS = 4096 * 4096;

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
