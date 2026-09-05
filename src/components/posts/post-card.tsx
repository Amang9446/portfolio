import Link from "next/link";
import type { PostSummary } from "@/lib/posts";
import PostCover from "./post-cover";
import TagList from "./tag-list";
import ViewCount from "./view-count";

interface PostCardProps {
  post: PostSummary;
  featured?: boolean;
  className?: string;
}

function formatDate(date: string | null) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function PostCard({
  post,
  featured = false,
  className = "",
}: PostCardProps) {
  return (
    <article className={`group ${className}`}>
      <Link
        href={`/blog/${post.slug}`}
        className={`block rounded-xl outline-offset-4 focus-visible:outline-2 ${
          featured
            ? "md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-center md:gap-12"
            : ""
        }`}
      >
        <PostCover
          post={post}
          ratio={featured ? "3/2" : "16/9"}
          interactive
          className="transition-colors duration-300 group-hover:border-primary/40"
        />

        <div className={featured ? "mt-6 md:mt-0" : "mt-5"}>
          <div className="flex flex-wrap items-center gap-2.5">
            <time
              dateTime={post.published_at ?? undefined}
              className="block font-mono text-xs tracking-wide text-muted-foreground"
            >
              {formatDate(post.published_at)}
            </time>
            <span aria-hidden="true" className="text-muted-foreground/50">
              ·
            </span>
            <ViewCount count={post.view_count} />
          </div>
          {/* Not links: the whole card is already one. */}
          <TagList tags={post.tags} limit={3} linked={false} className="mt-3" />
          <h3
            className={`mt-3 font-semibold leading-snug transition-colors group-hover:text-primary ${
              featured ? "text-2xl md:text-3xl" : "text-lg"
            }`}
          >
            {post.title}
          </h3>
          {post.excerpt && (
            <p
              className={`mt-3 leading-relaxed text-muted-foreground ${
                featured ? "max-w-[46ch] line-clamp-4" : "line-clamp-3 text-sm"
              }`}
            >
              {post.excerpt}
            </p>
          )}
          <span
            aria-hidden="true"
            className={`inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground transition-colors group-hover:text-primary ${
              featured ? "mt-6" : "mt-4"
            }`}
          >
            Read article
            <span className="transition-transform duration-300 ease-out group-hover:translate-x-1">
              &rarr;
            </span>
          </span>
        </div>
      </Link>
    </article>
  );
}
