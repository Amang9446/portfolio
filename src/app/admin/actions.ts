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
import { filterOrphanedMediaPaths } from "@/lib/media";
import { parseTagsField } from "@/lib/tags";
import { sanitizeHttpUrl } from "@/lib/urls";

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
    console.error("Admin sign-in failed:", error.message);
    redirect(adminErrorUrl("/admin/login", "invalid-login"));
  }
  // Valid credentials but not an admin: end the session immediately.
  if (!isAdminEmail(email)) {
    await supabase.auth.signOut();
    redirect(adminErrorUrl("/admin/login", "unauthorized"));
  }
  redirect("/admin");
}

export async function changePassword(formData: FormData) {
  const supabase = await requireUser();
  const currentPassword = String(formData.get("current_password") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!currentPassword) {
    redirect(adminErrorUrl("/admin/account", "current-password-incorrect"));
  }
  if (password.length < 12) {
    redirect(adminErrorUrl("/admin/account", "password-short"));
  }
  if (password !== confirm) {
    redirect(adminErrorUrl("/admin/account", "password-mismatch"));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) {
    redirect("/admin/login");
  }

  // Re-verify current credentials before updating password
  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });
  if (verifyError) {
    console.error("Current password verification failed:", verifyError.message);
    redirect(adminErrorUrl("/admin/account", "current-password-incorrect"));
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    console.error("Failed to update password:", error.message);
    redirect(adminErrorUrl("/admin/account", "password-update-failed"));
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
    cover_image_url:
      sanitizeHttpUrl(String(formData.get("cover_image_url") ?? ""), {
        allowRelative: true,
      }) ?? "",
    cover_image_alt: String(formData.get("cover_image_alt") ?? "").trim(),
    show_on_home: formData.get("show_on_home") === "on",
    tags: parseTagsField(String(formData.get("tags") ?? "")),
    published,
    meta: {
      title: String(formData.get("meta_title") ?? "").trim(),
      description: String(formData.get("meta_description") ?? "").trim(),
      keywords: String(formData.get("meta_keywords") ?? "").trim(),
      ogImage:
        sanitizeHttpUrl(String(formData.get("meta_og_image") ?? ""), {
          allowRelative: true,
        }) ?? "",
    },
  };

  if (!post.title || !post.slug) {
    redirect(
      adminErrorUrl(`/admin/posts/${id || "new"}`, "post-required-fields"),
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
      console.error("Failed to load post for update:", existing.error.message);
      redirect(adminErrorUrl(`/admin/posts/${id}`, "post-not-found"));
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
    console.error("Failed to save post:", error.message);
    redirect(adminErrorUrl(`/admin/posts/${id || "new"}`, "post-save-failed"));
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
    redirect(adminErrorUrl("/admin/posts", "post-missing-id"));
  }

  const existing = await supabase
    .from("posts")
    .select("published_at, slug")
    .eq("id", id)
    .maybeSingle();
  if (existing.error) {
    console.error(
      "Failed to load post for publish toggle:",
      existing.error.message,
    );
    redirect(adminErrorUrl("/admin/posts", "post-not-found"));
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
    console.error("Failed to update post publish state:", error.message);
    redirect(adminErrorUrl("/admin/posts", "post-save-failed"));
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
    redirect(adminErrorUrl("/admin/posts", "post-missing-id"));
  }
  const { error } = await supabase
    .from("posts")
    .update({ show_on_home: showOnHome })
    .eq("id", id);
  if (error) {
    console.error("Failed to update post show_on_home:", error.message);
    redirect(adminErrorUrl("/admin/posts", "post-save-failed"));
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
    redirect(adminErrorUrl("/admin/posts", "post-missing-id"));
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

  // Query remaining posts to ensure we never delete media still referenced by other posts
  let safeMediaToDelete: string[] = [];
  if (existing) {
    const { data: otherPosts, error: otherLoadError } = await supabase
      .from("posts")
      .select("content, cover_image_url")
      .neq("id", id);
    if (otherLoadError) {
      console.error(
        "Failed to load remaining posts for media comparison:",
        otherLoadError.message,
      );
    } else {
      safeMediaToDelete = filterOrphanedMediaPaths(existing, otherPosts ?? []);
    }
  }

  const { error } = await supabase.from("posts").delete().eq("id", id);
  if (error) {
    console.error("Failed to delete post:", error.message);
    redirect(adminErrorUrl("/admin/posts", "post-delete-failed"));
  }

  // Best-effort: the post is already gone, so a storage failure here should
  // leave orphaned files rather than a confusing error on a completed delete.
  if (safeMediaToDelete.length > 0) {
    const { error: storageError } = await supabase.storage
      .from("media")
      .remove(safeMediaToDelete);
    if (storageError) {
      console.error(
        "Post deleted, but its media could not be removed:",
        storageError.message,
      );
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
    console.error(`Failed to update setting '${key}':`, error.message);
    redirect(adminErrorUrl("/admin/content", "content-save-failed"));
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
      image:
        sanitizeHttpUrl(String(formData.get("image") ?? ""), {
          allowRelative: true,
        }) ?? "",
    },
    "hero-saved",
  );
}

export async function saveContact(formData: FormData) {
  const socials = [
    {
      name: "GitHub",
      icon: "github",
      url: sanitizeHttpUrl(String(formData.get("github") ?? "")) ?? "",
    },
    {
      name: "LinkedIn",
      icon: "linkedin",
      url: sanitizeHttpUrl(String(formData.get("linkedin") ?? "")) ?? "",
    },
    {
      name: "X",
      icon: "x",
      url: sanitizeHttpUrl(String(formData.get("x") ?? "")) ?? "",
    },
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
    console.error("Failed to save sections:", error.message);
    redirect(adminErrorUrl("/admin/content", "content-save-failed"));
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
      console.error("Failed to insert skills:", ins.error.message);
      redirect(adminErrorUrl("/admin/content", "content-save-failed"));
    }
  } else if (del.error) {
    console.error("Failed to delete skills:", del.error.message);
    redirect(adminErrorUrl("/admin/content", "content-save-failed"));
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
    image:
      sanitizeHttpUrl(String(formData.get("image") ?? ""), {
        allowRelative: true,
      }) ?? "",
    demo_url: sanitizeHttpUrl(String(formData.get("demo_url") ?? "")),
    github_url: sanitizeHttpUrl(String(formData.get("github_url") ?? "")),
    docs_url: sanitizeHttpUrl(String(formData.get("docs_url") ?? "")),
    tags: String(formData.get("tags") ?? "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
    sort_order: Number(formData.get("sort_order") ?? 0) || 0,
    visible: formData.get("visible") === "on",
  };

  if (!project.title) {
    redirect(
      adminErrorUrl(
        `/admin/projects/${id || "new"}`,
        "project-required-fields",
      ),
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
    console.error("Failed to save project:", error.message);
    redirect(
      adminErrorUrl(`/admin/projects/${id || "new"}`, "project-save-failed"),
    );
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
    redirect(adminErrorUrl("/admin/projects", "project-missing-id"));
  }
  const { error } = await supabase
    .from("projects")
    .update({ visible })
    .eq("id", id);
  if (error) {
    console.error("Failed to toggle project visibility:", error.message);
    redirect(adminErrorUrl("/admin/projects", "project-save-failed"));
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
    redirect(adminErrorUrl("/admin/projects", "project-missing-id"));
  }
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) {
    console.error("Failed to delete project:", error.message);
    redirect(adminErrorUrl("/admin/projects", "project-delete-failed"));
  }
  revalidatePublic();
  redirect(adminNoticeUrl("/admin/projects", "project-deleted"));
}
