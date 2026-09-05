import type { PostSummary } from "@/lib/posts";
import PostCard from "./post-card";

interface PostGridProps {
  posts: PostSummary[];
  className?: string;
}

/**
 * Lead-plus-grid layout. An odd count promotes the newest post to a wide
 * feature, which leaves an even tail — so the two-column grid below always
 * fills its rows instead of stranding a half-width orphan.
 */
export default function PostGrid({ posts, className = "" }: PostGridProps) {
  if (posts.length === 0) return null;

  const hasLead = posts.length % 2 === 1;
  const lead = hasLead ? posts[0] : null;
  const rest = hasLead ? posts.slice(1) : posts;

  return (
    <div className={`flex flex-col ${className}`}>
      {lead && <PostCard post={lead} featured />}

      {rest.length > 0 && (
        <div
          className={`grid gap-x-8 gap-y-12 sm:grid-cols-2 ${
            lead ? "mt-16 border-t border-border pt-16 md:mt-20 md:pt-20" : ""
          }`}
        >
          {rest.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
