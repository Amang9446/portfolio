import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import NavBar from "@/components/layout/nav-bar";
import Footer from "@/components/layout/Footer";
import MarkdownContent from "@/components/markdown/markdown-content";
import ArticleReadingProgress from "@/components/posts/article-reading-progress";
import ArticleMarkdownButton from "@/components/posts/article-markdown-button";
import ArticleShareButton from "@/components/posts/article-share-button";
import ArticleTableOfContents from "@/components/posts/article-table-of-contents";
import PostCover from "@/components/posts/post-cover";
import PostGrid from "@/components/posts/post-grid";
import PostLikeButton from "@/components/posts/post-like-button";
import PostViewTracker from "@/components/posts/post-view-tracker";
import { getArticleReadingData } from "@/lib/article-reading";
import { getPostBySlug, getPublishedPosts } from "@/lib/posts";
import { getSiteContent } from "@/lib/settings";
import { absoluteUrl } from "@/lib/site-url";
import { SOCIAL_IMAGE_SIZE, socialImageUrl } from "@/lib/social-image";

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
  const articlePath = `/blog/${encodeURIComponent(post.slug)}`;
  const articleUrl = absoluteUrl(articlePath);
  const shareImageUrl = socialImageUrl(
    post.slug,
    post.updated_at || post.id,
  );
  const imageAlt = post.cover_image_alt.trim() || post.title;

  return {
    title,
    description,
    keywords: post.meta?.keywords || undefined,
    alternates: {
      canonical: articlePath,
      types: {
        "text/markdown": `${articlePath}.md`,
      },
    },
    openGraph: {
      title,
      description,
      url: articleUrl,
      siteName: "Aman Portfolio",
      type: "article",
      publishedTime: post.published_at ?? undefined,
      modifiedTime: post.updated_at,
      authors: ["Aman"],
      images: [
        {
          url: shareImageUrl,
          width: SOCIAL_IMAGE_SIZE.width,
          height: SOCIAL_IMAGE_SIZE.height,
          alt: imageAlt,
          type: "image/png",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      creator: "@amanunreal",
      images: [
        {
          url: shareImageUrl,
          width: SOCIAL_IMAGE_SIZE.width,
          height: SOCIAL_IMAGE_SIZE.height,
          alt: imageAlt,
        },
      ],
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
  const [post, site, publishedPosts] = await Promise.all([
    getPostBySlug(slug),
    getSiteContent(),
    getPublishedPosts(),
  ]);
  if (!post || !site.sections.blog) notFound();

  const { headings, readingMinutes } = getArticleReadingData(post.content);
  const articleUrl = absoluteUrl(`/blog/${encodeURIComponent(post.slug)}`);
  const morePosts = publishedPosts
    .filter((publishedPost) => publishedPost.id !== post.id)
    .slice(0, 2);

  return (
    <main className="flex min-h-screen flex-col bg-background text-foreground">
      <ArticleReadingProgress contentId="article-content" />
      <NavBar socialLinks={site.contact.socialLinks} sections={site.sections} />
      <article className="mx-auto w-full max-w-5xl flex-1 px-6 py-20 md:py-28">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center justify-between gap-4">
            <Link
              href="/blog"
              className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
            >
              &larr; Blog
            </Link>
            <ArticleMarkdownButton slug={post.slug} />
          </div>
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
            <span className="font-mono text-xs tracking-wide text-muted-foreground">
              {readingMinutes} min read
            </span>
            <span aria-hidden="true" className="text-muted-foreground/50">
              ·
            </span>
            <PostViewTracker
              key={post.id}
              postId={post.id}
              initialCount={post.view_count}
            />
            <span aria-hidden="true" className="text-muted-foreground/50">
              ·
            </span>
            <ArticleShareButton title={post.title} url={articleUrl} />
          </div>
        </div>

        <PostCover
          post={post}
          ratio="wide"
          fallback="none"
          className="mt-10 md:mt-12"
          eager
        />

        <div
          className={`mx-auto mt-12 md:mt-16 ${
            headings.length >= 2
              ? "max-w-5xl lg:grid lg:grid-cols-[minmax(0,1fr)_12rem] lg:gap-12"
              : "max-w-3xl"
          }`}
        >
          {headings.length >= 2 && (
            <ArticleTableOfContents headings={headings} />
          )}
          <div
            id="article-content"
            className={`markdown min-w-0 max-w-3xl lg:col-start-1 lg:row-start-1 ${
              headings.length >= 2 ? "mt-10 lg:mt-0" : ""
            }`}
          >
            <MarkdownContent
              content={post.content}
              readingExperience
              articleHeadings={headings}
            />
          </div>
        </div>

        <PostLikeButton
          postId={post.id}
          initialCount={post.like_count}
          className="mx-auto mt-14 max-w-3xl md:mt-18"
        />
      </article>
      {morePosts.length > 0 && (
        <section
          aria-labelledby="keep-reading-heading"
          className="mx-auto w-full max-w-5xl border-t border-border px-6 pt-16 pb-20 md:pt-20 md:pb-28"
        >
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">
            More writing
          </p>
          <h2 id="keep-reading-heading" className="mt-3 text-2xl font-semibold">
            Keep reading
          </h2>
          <PostGrid posts={morePosts} className="mt-10" />
        </section>
      )}
      <Footer author={site.metadata.author} />
    </main>
  );
}
