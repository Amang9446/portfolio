import { getPublishedPosts, type PostSummary } from "@/lib/posts";
import { getSiteContent } from "@/lib/settings";
import { absoluteUrl } from "@/lib/site-url";

export const feedPath = "/feed.xml";

export const feedHeaders = {
  "Content-Type": "application/rss+xml; charset=utf-8",
} as const;

/** XML text escaping. `&` must be replaced first or it double-escapes. */
function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function oneLine(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

/** RSS 2.0 requires RFC 822 dates, which is exactly what toUTCString emits. */
function rfc822(date: string | null) {
  if (!date) return null;
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toUTCString();
}

function feedItem(post: PostSummary) {
  const url = absoluteUrl(`/blog/${encodeURIComponent(post.slug)}`);
  const pubDate = rfc822(post.published_at);

  const lines = [
    "    <item>",
    `      <title>${escapeXml(post.title)}</title>`,
    `      <link>${escapeXml(url)}</link>`,
    // Permalinks can change when a slug is edited; the row id never does.
    `      <guid isPermaLink="false">${escapeXml(post.id)}</guid>`,
  ];

  if (pubDate) {
    lines.push(`      <pubDate>${pubDate}</pubDate>`);
  }
  if (post.excerpt) {
    lines.push(`      <description>${escapeXml(oneLine(post.excerpt))}</description>`);
  }
  for (const tag of post.tags) {
    lines.push(`      <category>${escapeXml(tag)}</category>`);
  }

  lines.push("    </item>");
  return lines.join("\n");
}

export async function buildFeedXml() {
  const site = await getSiteContent();
  // An unpublished blog yields an empty channel rather than a 404, so existing
  // subscribers see "no new posts" instead of a broken feed.
  const posts = site.sections.blog ? await getPublishedPosts() : [];

  const selfUrl = absoluteUrl(feedPath);
  const latest = rfc822(posts[0]?.updated_at ?? null);

  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "  <channel>",
    `    <title>${escapeXml(site.metadata.title)}</title>`,
    `    <link>${escapeXml(absoluteUrl("/blog"))}</link>`,
    `    <description>${escapeXml(oneLine(site.metadata.description))}</description>`,
    "    <language>en</language>",
    `    <atom:link href="${escapeXml(selfUrl)}" rel="self" type="application/rss+xml" />`,
  ];

  if (latest) {
    lines.push(`    <lastBuildDate>${latest}</lastBuildDate>`);
  }

  lines.push(...posts.map(feedItem), "  </channel>", "</rss>");

  return `${lines.join("\n")}\n`;
}
