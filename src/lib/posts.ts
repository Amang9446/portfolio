import { createClient } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";
import { isSupabaseConfigured } from "@/lib/supabase/config";

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
  meta: PostMeta;
  created_at: string;
  updated_at: string;
}

export type PostSummary = Omit<Post, "content">;

const postSummaryColumns =
  "id, slug, title, excerpt, cover_image_url, cover_image_alt, show_on_home, view_count, published, published_at, meta, created_at, updated_at";

function withLikeCount<T>(post: T) {
  const likeCount = Number(
    (post as T & { like_count?: number }).like_count,
  );
  return {
    ...post,
    like_count: Number.isFinite(likeCount) ? Math.max(0, likeCount) : 0,
  };
}

async function loadPublishedPosts(homeOnly: boolean): Promise<PostSummary[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createPublicClient();
  let query = supabase
    .from("posts")
    .select(postSummaryColumns)
    .eq("published", true)
    .order("published_at", { ascending: false });

  if (homeOnly) {
    query = query.eq("show_on_home", true);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Failed to load posts:", error.message);
    return [];
  }
  return (
    (data as unknown as Array<Omit<PostSummary, "like_count">> | null)?.map(
      withLikeCount,
    ) ?? []
  );
}

// List pages do not need article bodies, so both queries skip `content`.
export function getPublishedPosts(): Promise<PostSummary[]> {
  return loadPublishedPosts(false);
}

export function getHomePosts(): Promise<PostSummary[]> {
  return loadPublishedPosts(true);
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  if (!isSupabaseConfigured()) return null;
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
  return data ? withLikeCount(data as unknown as Post) : null;
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
  return (data ?? []).map(withLikeCount) as Post[];
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
  return data ? withLikeCount(data) : null;
}
