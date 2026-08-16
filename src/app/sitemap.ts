import type { MetadataRoute } from "next";
import { getAllTags, getPublishedPosts } from "@/lib/posts";
import { getSiteContent } from "@/lib/settings";
import { absoluteUrl } from "@/lib/site-url";

export const revalidate = 60;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = await getSiteContent();

  const entries: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];

  // A hidden blog 404s at /blog, so it must not be advertised here either.
  if (!site.sections.blog) return entries;

  const posts = await getPublishedPosts();

  entries.push({
    url: absoluteUrl("/blog"),
    lastModified: posts[0]?.updated_at
      ? new Date(posts[0].updated_at)
      : new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  });

  for (const post of posts) {
    entries.push({
      url: absoluteUrl(`/blog/${encodeURIComponent(post.slug)}`),
      lastModified: new Date(post.updated_at),
      changeFrequency: "monthly",
      priority: 0.7,
    });
  }

  for (const tag of await getAllTags()) {
    entries.push({
      url: absoluteUrl(`/blog/tag/${tag.slug}`),
      changeFrequency: "weekly",
      priority: 0.4,
    });
  }

  return entries;
}
