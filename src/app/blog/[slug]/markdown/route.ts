import { NextResponse } from "next/server";
import {
  articleMarkdownPath,
  buildArticleMarkdown,
  markdownHeaders,
} from "@/lib/article-markdown";
import { getPostBySlug, getPublishedPosts } from "@/lib/posts";
import { getSiteContent } from "@/lib/settings";

export const revalidate = 60;

export async function generateStaticParams() {
  const posts = await getPublishedPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const [post, site] = await Promise.all([
    getPostBySlug(slug),
    getSiteContent(),
  ]);

  if (!post || !site.sections.blog) {
    return new NextResponse("Not found\n", {
      status: 404,
      headers: markdownHeaders,
    });
  }

  const htmlPath = `/blog/${encodeURIComponent(post.slug)}`;
  const markdownPath = articleMarkdownPath(post.slug);

  return new NextResponse(buildArticleMarkdown(post, site.metadata.author), {
    headers: {
      ...markdownHeaders,
      Link: `<${htmlPath}>; rel="canonical", <${markdownPath}>; rel="alternate"; type="text/markdown", </llms.txt>; rel="describedby"`,
    },
  });
}
