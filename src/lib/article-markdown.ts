import type { Post } from "@/lib/posts";
import { absoluteUrl } from "@/lib/site-url";

export const markdownHeaders = {
  "Content-Type": "text/markdown; charset=utf-8",
} as const;

export function articleMarkdownPath(slug: string) {
  return `/blog/${encodeURIComponent(slug)}.md`;
}

function oneLine(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeMarkdown(value: string) {
  return value.replace(/\r\n/g, "\n").trim();
}

export function buildArticleMarkdown(post: Post, author: string) {
  const htmlUrl = absoluteUrl(`/blog/${encodeURIComponent(post.slug)}`);
  const published = post.published_at?.slice(0, 10);
  const excerpt = oneLine(post.excerpt);
  const coverUrl = post.cover_image_url.trim();
  const coverAlt = oneLine(post.cover_image_alt) || post.title;

  const lines = [`# ${oneLine(post.title)}`, ""];

  if (excerpt) {
    lines.push(`> ${excerpt}`, "");
  }

  lines.push(`- Source: ${htmlUrl}`, `- Author: ${author}`);
  if (published) {
    lines.push(`- Published: ${published}`);
  }
  lines.push("");

  if (coverUrl) {
    lines.push(`![${coverAlt}](${coverUrl})`, "");
  }

  const body = normalizeMarkdown(post.content);
  if (body) {
    lines.push(body, "");
  }

  return lines.join("\n");
}
