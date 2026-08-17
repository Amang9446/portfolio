import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { postCacheTag, postsCacheTag } from "@/lib/cache";
import { tagSlug } from "@/lib/tags";

export interface PostMeta {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
}

export interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  cover_image_url: string;
  cover_image_alt: string;
  show_on_home: boolean;
  view_count: number;
  like_count: number;
  published: boolean;
  published_at: string | null;
  tags: string[];
  meta: PostMeta;
  created_at: string;
  updated_at: string;
}

export type PostSummary = Omit<Post, "content">;

export interface TagSummary {
  slug: string;
  label: string;
  count: number;
}

const postSummaryColumns =
  "id, slug, title, excerpt, cover_image_url, cover_image_alt, show_on_home, view_count, published, published_at, tags, meta, created_at, updated_at";

function normalizePost<T>(post: T) {
  const row = post as T & { like_count?: number; tags?: unknown };
  const likeCount = Number(row.like_count);

  return {
    ...post,
    like_count: Number.isFinite(likeCount) ? Math.max(0, likeCount) : 0,
    tags: Array.isArray(row.tags)
      ? row.tags.filter((tag): tag is string => typeof tag === "string")
      : [],
  };
}

async function fetchPublishedPosts(homeOnly: boolean): Promise<PostSummary[]> {
  const supabase = createPublicClient();
  const query = supabase
    .from("posts")
    .select(postSummaryColumns)
    .eq("published", true)
    .order("published_at", { ascending: false });

  const { data, error } = await (homeOnly
    ? query.eq("show_on_home", true)
    : query);

  if (error) {
    console.error("Failed to load posts:", error.message);
    return [];
  }
  return (
    (
      data as unknown as Array<Omit<PostSummary, "like_count" | "tags">> | null
    )?.map(normalizePost) ?? []
  );
}

async function fetchPublishedPostBySlug(slug: string): Promise<Post | null> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();
  if (error) {
    console.error("Failed to load post:", error.message);
    return null;
  }
  return data ? normalizePost(data as unknown as Post) : null;
}

async function fetchPublishedPostsWithContent(): Promise<Post[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("published", true)
    .order("published_at", { ascending: false });
  if (error) {
    console.error("Failed to load posts:", error.message);
    return [];
  }
  return (data ?? []).map((post) => normalizePost(post as Post));
}

// List pages do not need article bodies, so both queries skip `content`.
export async function getPublishedPosts(): Promise<PostSummary[]> {
  if (!isSupabaseConfigured()) return [];
  return unstable_cache(() => fetchPublishedPosts(false), ["published-posts"], {
    tags: [postsCacheTag()],
    revalidate: 60,
  })();
}

export async function getHomePosts(): Promise<PostSummary[]> {
  if (!isSupabaseConfigured()) return [];
  return unstable_cache(() => fetchPublishedPosts(true), ["home-posts"], {
    tags: [postsCacheTag()],
    revalidate: 60,
  })();
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  if (!isSupabaseConfigured()) return null;
  return unstable_cache(
    () => fetchPublishedPostBySlug(slug),
    ["post-by-slug", slug],
    { tags: [postsCacheTag(), postCacheTag(slug)], revalidate: 60 },
  )();
}

/**
 * Every tag in use, most-used first, then alphabetical.
 *
 * Derived from the already-cached published list rather than its own query —
 * the post count here is small, and this keeps the free-tier read count flat.
 */
export async function getAllTags(): Promise<TagSummary[]> {
  const posts = await getPublishedPosts();
  const bySlug = new Map<string, TagSummary>();

  for (const post of posts) {
    // Cached payloads written before `tags` existed have no such field.
    for (const tag of post.tags ?? []) {
      const slug = tagSlug(tag);
      if (!slug) continue;

      const existing = bySlug.get(slug);
      if (existing) existing.count += 1;
      else bySlug.set(slug, { slug, label: tag, count: 1 });
    }
  }

  return [...bySlug.values()].sort(
    (a, b) => b.count - a.count || a.label.localeCompare(b.label),
  );
}

export async function getPostsByTag(slug: string): Promise<PostSummary[]> {
  const posts = await getPublishedPosts();
  return posts.filter((post) =>
    (post.tags ?? []).some((tag) => tagSlug(tag) === slug),
  );
}

export async function getPublishedPostsWithContent(): Promise<Post[]> {
  if (!isSupabaseConfigured()) return [];
  return unstable_cache(
    () => fetchPublishedPostsWithContent(),
    ["published-posts-content"],
    { tags: [postsCacheTag()], revalidate: 60 },
  )();
}

export async function getAllPosts(): Promise<Post[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("Failed to load posts:", error.message);
    return [];
  }
  return (data ?? []).map(normalizePost) as Post[];
}

export async function getPostById(id: string): Promise<Post | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    console.error("Failed to load post:", error.message);
    return null;
  }
  return data ? normalizePost(data) : null;
}
