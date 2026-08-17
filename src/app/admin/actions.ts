"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";
import {
  adminErrorUrl,
  adminNoticeUrl,
  type AdminNotice,
} from "@/lib/admin-feedback";
import {
  revalidateAllArticleRoutes,
  revalidateArticle,
  revalidateArticles,
  revalidatePublic,
} from "@/lib/cache";
import { slugify } from "@/lib/markdown-commands";
import { postMediaPaths } from "@/lib/media";
import { parseTagsField } from "@/lib/tags";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdminEmail(user.email)) redirect("/admin/login");
  return supabase;
}

async function loadPostSlugs(
  supabase: Awaited<ReturnType<typeof requireUser>>,
) {
  const { data, error } = await supabase.from("posts").select("slug");
  if (error) {
    console.error(
      "Failed to load post slugs for cache invalidation:",
      error.message,
    );
    return [];
  }
  return (data ?? []).map((row) => row.slug).filter(Boolean);
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) {
    redirect(`/admin/login?error=${encodeURIComponent(error.message)}`);
  }
  // Valid credentials but not an admin: end the session immediately.
  if (!isAdminEmail(email)) {
    await supabase.auth.signOut();
    redirect(
      `/admin/login?error=${encodeURIComponent("This account does not have admin access")}`,
    );
  }
  redirect("/admin");
}

export async function changePassword(formData: FormData) {
  const supabase = await requireUser();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password.length < 12) {
    redirect(
      adminErrorUrl(
        "/admin/account",
        "Password must be at least 12 characters",
      ),
    );
  }
  if (password !== confirm) {
    redirect(adminErrorUrl("/admin/account", "Passwords do not match"));
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    redirect(adminErrorUrl("/admin/account", error.message));
  }
  redirect(adminNoticeUrl("/admin/account", "password-updated"));
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

// ---------------------------------------------------------------------------
// Posts
// ---------------------------------------------------------------------------

// Used by the editor's live slug check. Fails open (checked: false) so a
// transient error never blocks writing — savePost remains the real validation.
export async function checkPostSlugAvailability(
  slug: string,
  excludeId?: string,
): Promise<{ taken: boolean; checked: boolean }> {
  const supabase = await requireUser();
  const cleaned = slug.trim();
  if (!cleaned) return { taken: false, checked: false };

  let query = supabase.from("posts").select("id").eq("slug", cleaned);
  if (excludeId) query = query.neq("id", excludeId);
  const { data, error } = await query.maybeSingle();
  if (error) {
    console.error("Failed to check post slug:", error.message);
    return { taken: false, checked: false };
  }
  return { taken: Boolean(data), checked: true };
}

export async function savePost(formData: FormData) {
  const supabase = await requireUser();

  const id = String(formData.get("id") ?? "");
  const published = formData.get("published") === "on";
  const post = {
    title: String(formData.get("title") ?? "").trim(),
    slug: String(formData.get("slug") ?? "").trim(),
    excerpt: String(formData.get("excerpt") ?? "").trim(),
    content: String(formData.get("content") ?? ""),
    cover_image_url: String(formData.get("cover_image_url") ?? "").trim(),
    cover_image_alt: String(formData.get("cover_image_alt") ?? "").trim(),
    show_on_home: formData.get("show_on_home") === "on",
    tags: parseTagsField(String(formData.get("tags") ?? "")),
    published,
    meta: {
      title: String(formData.get("meta_title") ?? "").trim(),
      description: String(formData.get("meta_description") ?? "").trim(),
      keywords: String(formData.get("meta_keywords") ?? "").trim(),
      ogImage: String(formData.get("meta_og_image") ?? "").trim(),
    },
  };

  if (!post.title || !post.slug) {
    redirect(
      adminErrorUrl(
        `/admin/posts/${id || "new"}`,
        "Title and slug are required",
      ),
    );
  }

  let error;
  let previousSlug: string | null = null;
  if (id) {
    const existing = await supabase
      .from("posts")
      .select("published_at, slug")
      .eq("id", id)
      .maybeSingle();
    if (existing.error) {
      redirect(adminErrorUrl(`/admin/posts/${id}`, existing.error.message));
    }
    previousSlug = existing.data?.slug ?? null;
    const published_at = published
      ? (existing.data?.published_at ?? new Date().toISOString())
      : null;
    ({ error } = await supabase
      .from("posts")
      .update({ ...post, published_at })
      .eq("id", id));
  } else {
    ({ error } = await supabase.from("posts").insert({
      ...post,
      published_at: published ? new Date().toISOString() : null,
    }));
  }

  if (error) {
    redirect(adminErrorUrl(`/admin/posts/${id || "new"}`, error.message));
  }

  revalidatePublic();
  revalidateArticles([previousSlug, post.slug]);
  redirect(
    adminNoticeUrl("/admin/posts", id ? "post-updated" : "post-created"),
  );
}

// Quick publish/unpublish from the posts list, without opening the editor
export async function togglePostPublished(formData: FormData) {
  const supabase = await requireUser();
  const id = String(formData.get("id") ?? "");
  const publish = formData.get("publish") === "true";
  if (!id) {
    redirect(adminErrorUrl("/admin/posts", "Missing post ID"));
  }

  const existing = await supabase
    .from("posts")
    .select("published_at, slug")
    .eq("id", id)
    .maybeSingle();
  if (existing.error) {
    redirect(adminErrorUrl("/admin/posts", existing.error.message));
  }
  const { error } = await supabase
    .from("posts")
    .update({
      published: publish,
      published_at: publish
        ? (existing.data?.published_at ?? new Date().toISOString())
        : null,
    })
    .eq("id", id);
  if (error) {
    redirect(adminErrorUrl("/admin/posts", error.message));
  }

  revalidatePublic();
  if (existing.data?.slug) {
    revalidateArticle(existing.data.slug);
  } else {
    revalidateAllArticleRoutes();
  }
  revalidatePath("/admin/posts");
  redirect(
    adminNoticeUrl(
      "/admin/posts",
      publish ? "post-published" : "post-unpublished",
    ),
  );
}

// Quick home-page selection from the posts list. Drafts may be selected in
// advance, but the public query still requires `published = true`.
export async function togglePostOnHome(formData: FormData) {
  const supabase = await requireUser();
  const id = String(formData.get("id") ?? "");
  const showOnHome = formData.get("show_on_home") === "true";
  if (!id) {
    redirect(adminErrorUrl("/admin/posts", "Missing post ID"));
  }
  const { error } = await supabase
    .from("posts")
    .update({ show_on_home: showOnHome })
    .eq("id", id);
  if (error) {
    redirect(adminErrorUrl("/admin/posts", error.message));
  }
  revalidatePublic();
  revalidatePath("/admin/posts");
  redirect(
    adminNoticeUrl(
      "/admin/posts",
      showOnHome ? "post-added-home" : "post-removed-home",
    ),
  );
}

export async function deletePost(formData: FormData) {
  const supabase = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) {
    redirect(adminErrorUrl("/admin/posts", "Missing post ID"));
  }

  // Read the body before deleting the row — it is the only record of which
  // uploads belong to this post.
  const { data: existing, error: loadError } = await supabase
    .from("posts")
    .select("slug, content, cover_image_url")
    .eq("id", id)
    .maybeSingle();
  if (loadError) {
    // Not fatal: the delete can still proceed, but the cache invalidation
    // below has to fall back to purging every article route.
    console.error(
      "Failed to load post before delete; media cleanup skipped:",
      loadError.message,
    );
  }
  const slug = existing?.slug ?? null;

  const { error } = await supabase.from("posts").delete().eq("id", id);
  if (error) {
    redirect(adminErrorUrl("/admin/posts", error.message));
  }

  // Best-effort: the post is already gone, so a storage failure here should
  // leave orphaned files rather than a confusing error on a completed delete.
  if (existing) {
    const paths = postMediaPaths(existing);
    if (paths.length > 0) {
      const { error: storageError } = await supabase.storage
        .from("media")
        .remove(paths);
      if (storageError) {
        console.error(
          "Post deleted, but its media could not be removed:",
          storageError.message,
        );
      }
    }
  }

  revalidatePublic();
  if (slug) {
    revalidateArticle(slug);
  } else {
    revalidateAllArticleRoutes();
  }
  redirect(adminNoticeUrl("/admin/posts", "post-deleted"));
}

// ---------------------------------------------------------------------------
// Site content (hero, contact, skills, SEO)
// ---------------------------------------------------------------------------
async function upsertSetting(key: string, value: unknown, notice: AdminNotice) {
  const supabase = await requireUser();
  const { error } = await supabase
    .from("site_settings")
    .upsert({ key, value }, { onConflict: "key" });
  if (error) {
    redirect(adminErrorUrl("/admin/content", error.message));
  }
  revalidatePublic();
  redirect(adminNoticeUrl("/admin/content", notice));
}

export async function saveHero(formData: FormData) {
  await upsertSetting(
    "hero",
    {
      name: String(formData.get("name") ?? "").trim(),
      title: String(formData.get("title") ?? "").trim(),
      subtitle: String(formData.get("subtitle") ?? "").trim(),
      description: String(formData.get("description") ?? "").trim(),
      image: String(formData.get("image") ?? "").trim(),
    },
    "hero-saved",
  );
}

export async function saveContact(formData: FormData) {
  const socials = [
    {
      name: "GitHub",
      icon: "github",
      url: String(formData.get("github") ?? "").trim(),
    },
    {
      name: "LinkedIn",
      icon: "linkedin",
      url: String(formData.get("linkedin") ?? "").trim(),
    },
    { name: "X", icon: "x", url: String(formData.get("x") ?? "").trim() },
  ].filter((s) => s.url.length > 0);

  await upsertSetting(
    "contact",
    {
      email: String(formData.get("email") ?? "").trim(),
      availability: String(formData.get("availability") ?? "").trim(),
      responseTime: String(formData.get("responseTime") ?? "").trim(),
      socialLinks: socials,
    },
    "contact-saved",
  );
}

export async function saveMeta(formData: FormData) {
  await upsertSetting(
    "metadata",
    {
      title: String(formData.get("title") ?? "").trim(),
      description: String(formData.get("description") ?? "").trim(),
      author: String(formData.get("author") ?? "").trim(),
      keywords: String(formData.get("keywords") ?? "")
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean),
      // Stored bare; `twitterCreator()` adds the @ where the tag needs it.
      twitterHandle: String(formData.get("twitter_handle") ?? "")
        .trim()
        .replace(/^@/, ""),
    },
    "metadata-saved",
  );
}

export async function saveSections(formData: FormData) {
  const supabase = await requireUser();
  const blogEnabled = formData.get("blog") === "on";
  const { error } = await supabase.from("site_settings").upsert(
    {
      key: "sections",
      value: {
        projects: formData.get("projects") === "on",
        skills: formData.get("skills") === "on",
        blog: blogEnabled,
        contact: formData.get("contact") === "on",
      },
    },
    { onConflict: "key" },
  );
  if (error) {
    redirect(adminErrorUrl("/admin/content", error.message));
  }

  const slugs = await loadPostSlugs(supabase);
  revalidatePublic();
  revalidateArticles(slugs);
  if (!blogEnabled) {
    revalidateAllArticleRoutes();
  }
  redirect(adminNoticeUrl("/admin/content", "sections-saved"));
}

export async function saveSkills(formData: FormData) {
  const supabase = await requireUser();

  const parse = (field: string, category: "tech" | "tools") =>
    String(formData.get(field) ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((name, i) => ({ name, category, sort_order: i }));

  const rows = [...parse("tech", "tech"), ...parse("tools", "tools")];

  // Full replace: the two comma lists are the source of truth
  const del = await supabase
    .from("skills")
    .delete()
    .in("category", ["tech", "tools"]);
  if (!del.error && rows.length > 0) {
    const ins = await supabase.from("skills").insert(rows);
    if (ins.error) {
      redirect(adminErrorUrl("/admin/content", ins.error.message));
    }
  } else if (del.error) {
    redirect(adminErrorUrl("/admin/content", del.error.message));
  }

  revalidatePublic();
  redirect(adminNoticeUrl("/admin/content", "skills-saved"));
}

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

/**
 * A slug for a new project, unique against the ones already stored.
 *
 * `projects.slug` is NOT NULL and uniquely indexed (see the
 * add_project_case_studies migration), but the admin form has no slug field —
 * so it is derived here from the title, with a numeric suffix on collision.
 */
async function uniqueProjectSlug(
  supabase: Awaited<ReturnType<typeof requireUser>>,
  title: string,
) {
  const base = slugify(title) || "project";

  const { data, error } = await supabase
    .from("projects")
    .select("slug")
    .like("slug", `${base}%`);

  // Fail open: a unique-violation on insert is a clearer error than a wrong
  // slug, and the caller surfaces it.
  if (error) {
    console.error("Failed to check project slugs:", error.message);
    return base;
  }

  const taken = new Set((data ?? []).map((row) => row.slug));
  if (!taken.has(base)) return base;

  let suffix = 2;
  while (taken.has(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}

export async function saveProject(formData: FormData) {
  const supabase = await requireUser();

  const id = String(formData.get("id") ?? "");
  const project = {
    title: String(formData.get("title") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    image: String(formData.get("image") ?? "").trim(),
    demo_url: String(formData.get("demo_url") ?? "").trim() || null,
    github_url: String(formData.get("github_url") ?? "").trim() || null,
    docs_url: String(formData.get("docs_url") ?? "").trim() || null,
    tags: String(formData.get("tags") ?? "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
    sort_order: Number(formData.get("sort_order") ?? 0) || 0,
    visible: formData.get("visible") === "on",
  };

  if (!project.title) {
    redirect(
      adminErrorUrl(`/admin/projects/${id || "new"}`, "Title is required"),
    );
  }

  // `projects.slug` is NOT NULL with no default, so an insert must supply one.
  // Existing rows keep the slug they already have — changing it on every title
  // edit would break any URL already pointing at the project.
  const { error } = id
    ? await supabase.from("projects").update(project).eq("id", id)
    : await supabase.from("projects").insert({
        ...project,
        slug: await uniqueProjectSlug(supabase, project.title),
      });

  if (error) {
    redirect(adminErrorUrl(`/admin/projects/${id || "new"}`, error.message));
  }

  revalidatePublic();
  redirect(
    adminNoticeUrl(
      "/admin/projects",
      id ? "project-updated" : "project-created",
    ),
  );
}

// Quick show/hide from the projects list, without opening the editor
export async function toggleProjectVisibility(formData: FormData) {
  const supabase = await requireUser();
  const id = String(formData.get("id") ?? "");
  const visible = formData.get("visible") === "true";
  if (!id) {
    redirect(adminErrorUrl("/admin/projects", "Missing project ID"));
  }
  const { error } = await supabase
    .from("projects")
    .update({ visible })
    .eq("id", id);
  if (error) {
    redirect(adminErrorUrl("/admin/projects", error.message));
  }
  revalidatePublic();
  revalidatePath("/admin/projects");
  redirect(
    adminNoticeUrl(
      "/admin/projects",
      visible ? "project-shown" : "project-hidden",
    ),
  );
}

export async function deleteProject(formData: FormData) {
  const supabase = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) {
    redirect(adminErrorUrl("/admin/projects", "Missing project ID"));
  }
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) {
    redirect(adminErrorUrl("/admin/projects", error.message));
  }
  revalidatePublic();
  redirect(adminNoticeUrl("/admin/projects", "project-deleted"));
}
