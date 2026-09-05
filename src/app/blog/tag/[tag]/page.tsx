import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import NavBar from "@/components/layout/nav-bar";
import Footer from "@/components/layout/footer";
import PostGrid from "@/components/posts/post-grid";
import { getAllTags, getPostsByTag } from "@/lib/posts";
import { getSiteContent, pageTitle } from "@/lib/settings";
import { breadcrumbJsonLd, jsonLdScript } from "@/lib/structured-data";

export const revalidate = 60;

export async function generateStaticParams() {
  const tags = await getAllTags();
  return tags.map((tag) => ({ tag: tag.slug }));
}

interface PageProps {
  params: Promise<{ tag: string }>;
}

/** The label as the author spelled it, or null when nothing uses this slug. */
async function tagLabel(slug: string) {
  const tags = await getAllTags();
  return tags.find((tag) => tag.slug === slug)?.label ?? null;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { tag } = await params;
  const [site, label] = await Promise.all([getSiteContent(), tagLabel(tag)]);
  if (!label) return { title: pageTitle("Topic not found", site) };

  return {
    title: pageTitle(label, site),
    description: `Writing about ${label}.`,
    alternates: {
      canonical: `/blog/tag/${tag}`,
      types: { "application/rss+xml": "/feed.xml" },
    },
  };
}

export default async function TagPage({ params }: PageProps) {
  const { tag } = await params;
  const [site, label] = await Promise.all([getSiteContent(), tagLabel(tag)]);
  if (!site.sections.blog || !label) notFound();

  const posts = await getPostsByTag(tag);

  return (
    <main className="flex min-h-screen flex-col bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Blog", path: "/blog" },
              { name: label, path: `/blog/tag/${tag}` },
            ]),
          ),
        }}
      />
      <NavBar
        brand={site.hero.name}
        socialLinks={site.contact.socialLinks}
        sections={site.sections}
      />
      <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-20 md:py-28">
        <Link
          href="/blog"
          className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
        >
          &larr; Blog
        </Link>
        <p className="mt-6 font-mono text-xs uppercase tracking-[0.2em] text-primary">
          Topic
        </p>
        <h1 className="mt-4 text-3xl font-semibold md:text-4xl">{label}</h1>
        <p className="mt-4 text-muted-foreground">
          {posts.length} {posts.length === 1 ? "article" : "articles"}
        </p>

        <PostGrid posts={posts} className="mt-16 md:mt-20" />
      </div>
      <Footer author={site.metadata.author} />
    </main>
  );
}
