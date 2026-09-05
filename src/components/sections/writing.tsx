import Link from "next/link";
import type { PostSummary } from "@/lib/posts";
import PostGrid from "@/components/posts/post-grid";

interface WritingProps {
  posts: PostSummary[];
}

export default function Writing({ posts }: WritingProps) {
  if (posts.length === 0) return null;

  return (
    <section id="writing" className="scroll-mt-20 border-t border-border">
      <div className="mx-auto max-w-5xl px-6 py-24 md:py-32">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">
          Selected writing
        </p>
        <h2 className="mt-4 max-w-md text-3xl font-semibold md:text-4xl">
          Writing
        </h2>

        <PostGrid posts={posts} className="mt-16 md:mt-20" />

        <Link
          href="/blog"
          className="mt-16 inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-foreground md:mt-20"
        >
          All writing
          <span aria-hidden="true">&rarr;</span>
        </Link>
      </div>
    </section>
  );
}
