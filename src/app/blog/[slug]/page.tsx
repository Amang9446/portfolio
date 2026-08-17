import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import NavBar from "@/components/layout/nav-bar";
import Footer from "@/components/layout/footer";
import MarkdownContent from "@/components/markdown/markdown-content";
import ArticleLightbox from "@/components/posts/article-lightbox";
import ArticleReadingProgress from "@/components/posts/article-reading-progress";
import BackToTop from "@/components/posts/back-to-top";
import ArticleMarkdownButton from "@/components/posts/article-markdown-button";
import ArticleShareButton from "@/components/posts/article-share-button";
import ArticleTableOfContents from "@/components/posts/article-table-of-contents";
import PostCover from "@/components/posts/post-cover";
import PostGrid from "@/components/posts/post-grid";
import PostLikeButton from "@/components/posts/post-like-button";
import PostViewTracker from "@/components/posts/post-view-tracker";
import TagList from "@/components/posts/tag-list";
import { getArticleReadingData } from "@/lib/article-reading";
import { getPostBySlug, getPublishedPosts } from "@/lib/posts";
import { getSiteContent, pageTitle, twitterCreator } from "@/lib/settings";
import { absoluteUrl } from "@/lib/site-url";
import { SOCIAL_IMAGE_SIZE, socialImageUrl } from "@/lib/social-image";
import {
  blogPostingJsonLd,
  breadcrumbJsonLd,
  jsonLdScript,
} from "@/lib/structured-data";

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
  const [post, site] = await Promise.all([
    getPostBySlug(slug),
    getSiteContent(),
  ]);
  if (!post) return { title: pageTitle("Post not found", site) };

  const title = post.meta?.title || pageTitle(post.title, site);
  const description = post.meta?.description || post.excerpt;
  const articlePath = `/blog/${encodeURIComponent(post.slug)}`;
  const articleUrl = absoluteUrl(articlePath);
  const shareImageUrl = socialImageUrl(post.slug, post.updated_at || post.id);
  const imageAlt = post.cover_image_alt.trim() || post.title;

  return {
    title,
    description,
    keywords: post.meta?.keywords || undefined,
    alternates: {
      canonical: articlePath,
      // This replaces the root layout's `alternates`, so the feed link is
      // repeated here rather than inherited.
      types: {
        "text/markdown": `${articlePath}.md`,
        "application/rss+xml": "/feed.xml",
      },
    },
    openGraph: {
      title,
      description,
      url: articleUrl,
      siteName: `${site.metadata.author} Portfolio`,
      type: "article",
      publishedTime: post.published_at ?? undefined,
      modifiedTime: post.updated_at,
      authors: [site.metadata.author],
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
      creator: twitterCreator(site),
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript([
            blogPostingJsonLd(post, site),
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Blog", path: "/blog" },
              {
                name: post.title,
                path: `/blog/${encodeURIComponent(post.slug)}`,
              },
            ]),
          ]),
        }}
      />
      <ArticleReadingProgress contentId="article-content" />
      <ArticleLightbox contentId="article-content" />
      <NavBar
        brand={site.hero.name}
        socialLinks={site.contact.socialLinks}
        sections={site.sections}
      />
      <article className="mx-auto w-full max-w-5xl flex-1 px-6 py-20 md:py-28">
        <div className="mx-auto max-w-3xl">
          <div className="no-print flex items-center justify-between gap-4">
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
          {post.excerpt && (
            <p className="mt-4 text-lg leading-relaxed text-balance text-muted-foreground">
              {post.excerpt}
            </p>
          )}
          <div className="mt-5 flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
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
            <span className="no-print contents">
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
            </span>
          </div>
          <TagList tags={post.tags} className="mt-4" />
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

        {/* End-of-article mark */}
        <div
          aria-hidden="true"
          className="mx-auto mt-16 flex max-w-3xl items-center justify-center gap-4"
        >
          <span className="h-px w-12 bg-border" />
          <span className="h-1.5 w-1.5 rotate-45 bg-primary/70" />
          <span className="h-px w-12 bg-border" />
        </div>

        <PostLikeButton
          postId={post.id}
          initialCount={post.like_count}
          className="no-print mx-auto mt-14 max-w-3xl md:mt-18"
        />
      </article>
      {morePosts.length > 0 && (
        <section
          aria-labelledby="keep-reading-heading"
          className="no-print mx-auto w-full max-w-5xl border-t border-border px-6 pt-16 pb-20 md:pt-20 md:pb-28"
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
      <BackToTop />
    </main>
  );
}
