import type { Metadata } from "next";
import Link from "next/link";
import NavBar from "@/components/layout/nav-bar";
import Footer from "@/components/layout/Footer";
import { getPublishedPosts } from "@/lib/posts";
import { getSiteContent } from "@/lib/settings";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Blog | Aman",
  description: "Notes on React Native, web development, and open source.",
};

function formatDate(date: string | null) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function BlogPage() {
  const [posts, site] = await Promise.all([
    getPublishedPosts(),
    getSiteContent(),
  ]);

  return (
    <main className="flex min-h-screen flex-col bg-background text-foreground">
      <NavBar socialLinks={site.contact.socialLinks} />
      <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-20 md:py-28">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">
          Writing
        </p>
        <h1 className="mt-4 text-3xl font-semibold md:text-4xl">Blog</h1>

        {posts.length === 0 ? (
          <p className="mt-12 max-w-[48ch] leading-relaxed text-muted-foreground">
            Nothing published yet — first post is on its way. Meanwhile, my
            work lives on{" "}
            <a
              href={site.contact.socialLinks[0]?.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground"
            >
              GitHub
            </a>
            .
          </p>
        ) : (
          <div className="mt-14 flex flex-col">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group border-b border-border py-8 first:border-t"
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-baseline md:gap-10">
                  <time className="shrink-0 font-mono text-xs text-muted-foreground md:w-28">
                    {formatDate(post.published_at)}
                  </time>
                  <div>
                    <h2 className="text-xl font-semibold transition-colors group-hover:text-primary">
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p className="mt-2 max-w-[60ch] leading-relaxed text-muted-foreground">
                        {post.excerpt}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      <Footer author={site.metadata.author} />
    </main>
  );
}
