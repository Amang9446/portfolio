import Link from "next/link";
import { getAllPosts } from "@/lib/posts";
import { togglePostPublished } from "../../actions";

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
            <div
              key={post.id}
              className="flex items-center justify-between gap-4 border-b border-border py-4 first:border-t"
            >
              <Link
                href={`/admin/posts/${post.id}`}
                className={`group min-w-0 flex-1 ${post.published ? "" : "opacity-50"}`}
              >
                <p className="truncate font-medium transition-colors group-hover:text-primary">
                  {post.title}
                </p>
                <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                  /{post.slug} · updated {formatDate(post.updated_at)}
                </p>
              </Link>
              <form action={togglePostPublished} className="shrink-0">
                <input type="hidden" name="id" value={post.id} />
                <input
                  type="hidden"
                  name="publish"
                  value={String(!post.published)}
                />
                <button
                  type="submit"
                  title={
                    post.published
                      ? "Live on the blog — click to unpublish"
                      : "Draft — click to publish"
                  }
                  className={`rounded-md border px-2.5 py-1 font-mono text-xs transition-colors ${
                    post.published
                      ? "border-primary/40 text-primary hover:bg-primary/5"
                      : "border-border text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  {post.published ? "Published" : "Draft"}
                </button>
              </form>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
