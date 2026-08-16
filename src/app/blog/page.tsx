import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import NavBar from "@/components/layout/nav-bar";
import Footer from "@/components/layout/Footer";
import PostGrid from "@/components/posts/post-grid";
import { getAllTags, getPublishedPosts } from "@/lib/posts";
import { getSiteContent } from "@/lib/settings";
import {
  blogJsonLd,
  breadcrumbJsonLd,
  jsonLdScript,
} from "@/lib/structured-data";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Blog | Aman",
  description: "Notes on React Native, web development, and open source.",
};

export default async function BlogPage() {
  const [posts, site, tags] = await Promise.all([
    getPublishedPosts(),
    getSiteContent(),
    getAllTags(),
  ]);
  if (!site.sections.blog) notFound();

  return (
    <main className="flex min-h-screen flex-col bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript([
            blogJsonLd(site),
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Blog", path: "/blog" },
            ]),
          ]),
        }}
      />
      <NavBar socialLinks={site.contact.socialLinks} sections={site.sections} />
      <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-20 md:py-28">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">
          Writing
        </p>
        <h1 className="mt-4 text-3xl font-semibold md:text-4xl">Blog</h1>

        {tags.length > 0 && (
          <nav aria-label="Topics" className="mt-8">
            <ul className="flex flex-wrap items-center gap-2">
              {tags.map((tag) => (
                <li key={tag.slug}>
                  <Link
                    href={`/blog/tag/${tag.slug}`}
                    className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1 font-mono text-xs tracking-wide text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                  >
                    {tag.label}
                    <span className="text-muted-foreground/60">{tag.count}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}

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
          <PostGrid posts={posts} className="mt-16 md:mt-20" />
        )}
      </div>
      <Footer author={site.metadata.author} />
    </main>
  );
}
