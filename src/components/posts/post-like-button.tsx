"use client";

import { Heart } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface PostLikeButtonProps {
  postId: string;
  initialCount: number;
  className?: string;
}

interface LikeState {
  liked: boolean;
  like_count: number;
}

const visitorIdStorageKey = "portfolio-like-visitor-id";
// Superseded key. Still read (once, then migrated) so existing readers keep
// the likes they have already given instead of silently being able to re-like.
const legacyVisitorIdStorageKey = "aman-portfolio-like-visitor-id";
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
let inMemoryVisitorId: string | null = null;

function getVisitorId() {
  if (inMemoryVisitorId) return inMemoryVisitorId;

  try {
    const storedId = window.localStorage.getItem(visitorIdStorageKey);
    if (storedId && uuidPattern.test(storedId)) {
      inMemoryVisitorId = storedId;
      return storedId;
    }

    const legacyId = window.localStorage.getItem(legacyVisitorIdStorageKey);
    if (legacyId && uuidPattern.test(legacyId)) {
      inMemoryVisitorId = legacyId;
      window.localStorage.setItem(visitorIdStorageKey, legacyId);
      window.localStorage.removeItem(legacyVisitorIdStorageKey);
      return legacyId;
    }
  } catch {
    // A privacy mode may block storage. The in-memory fallback still lets the
    // reader react for the lifetime of this tab.
  }

  const visitorId = window.crypto.randomUUID();
  inMemoryVisitorId = visitorId;

  try {
    window.localStorage.setItem(visitorIdStorageKey, visitorId);
  } catch {
    // Keep using the in-memory ID when storage is unavailable.
  }

  return visitorId;
}

function parseLikeState(value: unknown): LikeState | null {
  if (!value || typeof value !== "object") return null;

  const result = value as Partial<LikeState>;
  const likeCount = Number(result.like_count);
  if (typeof result.liked !== "boolean" || !Number.isFinite(likeCount)) {
    return null;
  }

  return {
    liked: result.liked,
    like_count: Math.max(0, likeCount),
  };
}

function formatCount(count: number) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(count);
}

export default function PostLikeButton({
  postId,
  initialCount,
  className = "",
}: PostLikeButtonProps) {
  const safeInitialCount = Number.isFinite(initialCount)
    ? Math.max(0, initialCount)
    : 0;
  const [count, setCount] = useState(safeInitialCount);
  const [liked, setLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const headingId = useId();
  const statusId = useId();

  useEffect(() => {
    let active = true;

    const loadLikeState = async () => {
      const supabase = createClient();
      const { data, error: loadError } = await supabase.rpc(
        "get_post_like_state",
        {
          target_post_id: postId,
          target_visitor_id: getVisitorId(),
        },
      );

      if (!active) return;

      const nextState = parseLikeState(data);
      if (loadError || !nextState) {
        console.error(
          "Failed to load post like state:",
          loadError?.message ?? "Unexpected response",
        );
        setError("Likes are temporarily unavailable.");
      } else {
        setLiked(nextState.liked);
        setCount(nextState.like_count);
      }
      setIsLoading(false);
    };

    void loadLikeState();

    return () => {
      active = false;
    };
  }, [postId]);

  const toggleLike = async () => {
    if (isLoading || isSubmitting) return;

    const previousLiked = liked;
    const previousCount = count;
    const nextLiked = !previousLiked;

    setLiked(nextLiked);
    setCount(Math.max(0, previousCount + (nextLiked ? 1 : -1)));
    setIsSubmitting(true);
    setError("");

    const supabase = createClient();
    const { data, error: toggleError } = await supabase.rpc("set_post_like", {
      target_post_id: postId,
      target_visitor_id: getVisitorId(),
      target_liked: nextLiked,
    });
    const nextState = parseLikeState(data);

    if (toggleError || !nextState) {
      console.error(
        "Failed to update post like:",
        toggleError?.message ?? "Unexpected response",
      );
      setLiked(previousLiked);
      setCount(previousCount);
      setError("That didn’t work. Please try again.");
    } else {
      setLiked(nextState.liked);
      setCount(nextState.like_count);
    }

    setIsSubmitting(false);
  };

  const safeCount = Math.max(0, count);
  const countLabel = `${safeCount.toLocaleString("en-US")} ${safeCount === 1 ? "like" : "likes"}`;

  return (
    <section
      aria-labelledby={headingId}
      className={`border-t border-border pt-8 ${className}`}
    >
      <div className="flex flex-col gap-6 rounded-xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary">
            Enjoyed this article?
          </p>
          <h2 id={headingId} className="mt-2 text-lg font-semibold">
            Let me know it was useful.
          </h2>
          <p className="mt-1.5 max-w-md text-sm leading-relaxed text-muted-foreground">
            A quick like helps me decide what to explain next.
          </p>
        </div>

        <div className="shrink-0">
          <button
            type="button"
            aria-pressed={liked}
            aria-busy={isSubmitting}
            aria-label={`${liked ? "Unlike" : "Like"} this article. ${countLabel}.`}
            aria-describedby={error ? statusId : undefined}
            disabled={isLoading || isSubmitting}
            onClick={toggleLike}
            className={`group inline-flex min-h-11 w-full items-center justify-center overflow-hidden rounded-full border px-1.5 py-1.5 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-wait disabled:opacity-60 sm:w-auto ${
              liked
                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                : "border-border bg-background text-foreground hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
            }`}
          >
            <span className="inline-flex items-center gap-2 px-3">
              <Heart
                aria-hidden="true"
                className={`h-4 w-4 transition-transform duration-200 group-active:scale-90 ${
                  liked ? "fill-current" : ""
                }`}
                strokeWidth={1.8}
              />
              {isLoading ? "Loading" : liked ? "Liked" : "Like this article"}
            </span>
            <span
              aria-hidden="true"
              className={`border-l px-3 font-mono text-xs ${
                liked ? "border-primary-foreground/25" : "border-border"
              }`}
              title={countLabel}
            >
              {formatCount(safeCount)}
            </span>
          </button>

          <p
            id={statusId}
            role="status"
            aria-live="polite"
            className={`mt-2 min-h-4 text-center text-xs ${
              error ? "text-destructive" : "text-muted-foreground"
            }`}
          >
            {error || (liked ? "Thanks — that helps." : "")}
          </p>
        </div>
      </div>
    </section>
  );
}
