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

// Hairline weave angles, picked per post so a grid of coverless cards varies
// slightly instead of reading as a row of loading skeletons.
const WEAVE_ANGLES = [135, 45, 108, 18];

function weaveAngle(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
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

  return (
    <div className={frame}>
      {/* CMS images can come from Supabase Storage or an external URL. A
          native image keeps that source list open without growing Next config. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt={imageAlt}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        className={`absolute inset-0 h-full w-full object-cover ${
          interactive
            ? "transition-transform duration-700 ease-out group-hover:scale-[1.03]"
            : ""
        }`}
      />
    </div>
  );
}
