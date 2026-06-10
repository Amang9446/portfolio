import Link from "next/link";
import { getAllPosts } from "@/lib/posts";

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function AdminPostsPage() {
  const posts = await getAllPosts();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Posts</h1>
        <Link
          href="/admin/posts/new"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          New post
        </Link>
      </div>

      {posts.length === 0 ? (
        <p className="mt-10 text-muted-foreground">
          No posts yet. Write your first one.
        </p>
      ) : (
        <div className="mt-8 flex flex-col">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/admin/posts/${post.id}`}
              className="group flex items-center justify-between gap-4 border-b border-border py-4 first:border-t"
            >
              <div className="min-w-0">
                <p className="truncate font-medium transition-colors group-hover:text-primary">
                  {post.title}
                </p>
                <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                  /{post.slug} · updated {formatDate(post.updated_at)}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-md border px-2.5 py-1 font-mono text-xs ${
                  post.published
                    ? "border-primary/40 text-primary"
                    : "border-border text-muted-foreground"
                }`}
              >
                {post.published ? "Published" : "Draft"}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
