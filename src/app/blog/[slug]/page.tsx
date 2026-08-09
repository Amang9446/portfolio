import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import NavBar from "@/components/layout/nav-bar";
import Footer from "@/components/layout/Footer";
import PostCover from "@/components/posts/post-cover";
import PostViewTracker from "@/components/posts/post-view-tracker";
import { getPostBySlug, getPublishedPosts } from "@/lib/posts";
import { getSiteContent } from "@/lib/settings";

export const revalidate = 60;

// Prerender all published posts at build; new ones render on first hit (ISR)
export async function generateStaticParams() {
  const posts = await getPublishedPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "Post not found | Aman" };

  const title = post.meta?.title || `${post.title} | Aman`;
  const description = post.meta?.description || post.excerpt;
  const ogImage = post.meta?.ogImage || post.cover_image_url || undefined;

  return {
    title,
    description,
    keywords: post.meta?.keywords || undefined,
    openGraph: {
      title,
      description,
      type: "article",
      publishedTime: post.published_at ?? undefined,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };
}

function formatDate(date: string | null) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const [post, site] = await Promise.all([
    getPostBySlug(slug),
    getSiteContent(),
  ]);
  if (!post || !site.sections.blog) notFound();

  return (
    <main className="flex min-h-screen flex-col bg-background text-foreground">
      <NavBar socialLinks={site.contact.socialLinks} sections={site.sections} />
      <article className="mx-auto w-full max-w-5xl flex-1 px-6 py-20 md:py-28">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/blog"
            className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
          >
            &larr; Blog
          </Link>
          <h1 className="mt-6 text-3xl font-semibold leading-tight md:text-4xl">
            {post.title}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-2.5">
            <time
              dateTime={post.published_at ?? undefined}
              className="block font-mono text-xs tracking-wide text-muted-foreground"
            >
              {formatDate(post.published_at)}
            </time>
            <span aria-hidden="true" className="text-muted-foreground/50">
              ·
            </span>
            <PostViewTracker
              key={post.id}
              postId={post.id}
              initialCount={post.view_count}
            />
          </div>
        </div>

        <PostCover
          post={post}
          ratio="wide"
          fallback="none"
          className="mt-10 md:mt-12"
          eager
        />

        <div className="markdown mx-auto mt-12 max-w-3xl md:mt-16">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {post.content}
          </ReactMarkdown>
        </div>
      </article>
      <Footer author={site.metadata.author} />
    </main>
  );
}
