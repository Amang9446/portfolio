import Link from "next/link";
import { getAllPosts } from "@/lib/posts";
import { getAllDbProjects } from "@/lib/projects";

export default async function AdminHome() {
  const [posts, projects] = await Promise.all([
    getAllPosts(),
    getAllDbProjects(),
  ]);
  const published = posts.filter((p) => p.published).length;

  return (
    <div>
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link
          href="/admin/posts"
          className="rounded-lg border border-border p-6 transition-colors hover:border-primary/40"
        >
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Posts
          </p>
          <p className="mt-3 text-3xl font-semibold">{posts.length}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {published} published · {posts.length - published} draft
            {posts.length - published === 1 ? "" : "s"}
          </p>
        </Link>
        <Link
          href="/admin/projects"
          className="rounded-lg border border-border p-6 transition-colors hover:border-primary/40"
        >
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Projects
          </p>
          <p className="mt-3 text-3xl font-semibold">{projects.length}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {projects.length === 0
              ? "Using static config fallback"
              : "Live from Supabase"}
          </p>
        </Link>
      </div>
    </div>
  );
}
