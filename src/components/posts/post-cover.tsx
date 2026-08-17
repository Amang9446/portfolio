import Image from "next/image";
import { optimizedImageHosts } from "@/lib/image-hosts";
import type { PostSummary } from "@/lib/posts";

type CoverPost = Pick<
  PostSummary,
  "title" | "cover_image_url" | "cover_image_alt"
>;

const RATIOS = {
  "16/9": "aspect-[16/9]",
  "3/2": "aspect-[3/2]",
  // Wide banner for the article header; stays 16/9 on narrow screens
  wide: "aspect-[16/9] md:aspect-[21/9]",
} as const;

const IMAGE_SIZES: Record<keyof typeof RATIOS, string> = {
  "16/9": "(max-width: 640px) calc(100vw - 3rem), 464px",
  "3/2": "(max-width: 768px) calc(100vw - 3rem), 464px",
  wide: "(max-width: 1024px) calc(100vw - 3rem), 976px",
};

// Same list `images.remotePatterns` is built from, so the two cannot drift.
// Unknown CMS URLs still use a native image below instead of failing at runtime.
const OPTIMIZED_IMAGE_HOSTS = new Set(optimizedImageHosts());

function canUseNextImage(imageUrl: string) {
  if (imageUrl.startsWith("/")) return true;

  try {
    const url = new URL(imageUrl);
    return url.protocol === "https:" && OPTIMIZED_IMAGE_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
}

// Hairline weave angles, picked per post so a grid of coverless cards varies
// slightly instead of reading as a row of loading skeletons.
const WEAVE_ANGLES = [135, 45, 108, 18];

function weaveAngle(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++)
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return WEAVE_ANGLES[Math.abs(hash) % WEAVE_ANGLES.length];
}

interface PostCoverProps {
  post: CoverPost;
  className?: string;
  eager?: boolean;
  ratio?: keyof typeof RATIOS;
  /** Scale the image on hover of the enclosing `.group` — cards only. */
  interactive?: boolean;
  /**
   * What to render when the post has no cover image. Cards keep a plate so the
   * grid holds its rhythm; the article page renders nothing rather than a
   * decorative slab under the headline.
   */
  fallback?: "plate" | "none";
}

export default function PostCover({
  post,
  className = "",
  eager = false,
  ratio = "16/9",
  interactive = false,
  fallback = "plate",
}: PostCoverProps) {
  const imageUrl = post.cover_image_url.trim();
  const imageAlt = post.cover_image_alt.trim() || post.title;

  if (!imageUrl && fallback === "none") return null;

  const frame = `relative isolate overflow-hidden rounded-xl border border-border bg-card ${RATIOS[ratio]} ${className}`;

  if (!imageUrl) {
    const angle = weaveAngle(post.title);
    return (
      <div className={frame} aria-hidden="true">
        <div
          className="absolute inset-0 opacity-70"
          style={{
            backgroundImage: `repeating-linear-gradient(${angle}deg, transparent 0 7px, color-mix(in oklab, var(--foreground) 7%, transparent) 7px 8px)`,
          }}
        />
        <span className="absolute bottom-6 left-6 h-px w-10 bg-primary md:bottom-8 md:left-8" />
      </div>
    );
  }

  const imageClass = `object-cover ${
    interactive
      ? "transition-transform duration-700 ease-out group-hover:scale-[1.03]"
      : ""
  }`;

  return (
    <div className={frame}>
      {canUseNextImage(imageUrl) ? (
        <Image
          src={imageUrl}
          alt={imageAlt}
          fill
          sizes={IMAGE_SIZES[ratio]}
          preload={eager}
          className={imageClass}
        />
      ) : (
        // Preserve support for CMS image hosts that are not configured in
        // Next.js yet, including local blob URLs in the admin preview.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt={imageAlt}
          loading={eager ? "eager" : "lazy"}
          fetchPriority={eager ? "high" : "auto"}
          decoding="async"
          className={`absolute inset-0 h-full w-full ${imageClass}`}
        />
      )}
    </div>
  );
}
