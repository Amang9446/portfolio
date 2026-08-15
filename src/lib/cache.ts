import { revalidatePath, updateTag } from "next/cache";

export function postsCacheTag() {
  return "posts";
}

export function postCacheTag(slug: string) {
  return `post:${slug}`;
}

export function revalidatePublic() {
  revalidatePath("/");
  revalidatePath("/blog");
  revalidatePath("/llms.txt");
  revalidatePath("/llms-full.txt");
  updateTag(postsCacheTag());
}

export function revalidateArticle(slug: string) {
  if (!slug) return;
  // Destination path for the `/blog/:slug.md` rewrite — revalidatePath
  // matches route files, not the public URL. Vercel purges the CDN entries
  // for these paths; a long custom Cache-Control would ignore that purge.
  revalidatePath(`/blog/${slug}`);
  revalidatePath(`/blog/${slug}/markdown`);
  updateTag(postCacheTag(slug));
}

export function revalidateArticles(slugs: readonly (string | null | undefined)[]) {
  const unique = new Set<string>();
  for (const slug of slugs) {
    if (slug) unique.add(slug);
  }
  for (const slug of unique) {
    revalidateArticle(slug);
  }
}

export function revalidateAllArticleRoutes() {
  revalidatePath("/blog/[slug]", "layout");
}
