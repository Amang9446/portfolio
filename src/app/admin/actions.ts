"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdminEmail(user.email)) redirect("/admin/login");
  return supabase;
}

function revalidatePublic() {
  revalidatePath("/");
  revalidatePath("/blog");
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
      `/admin/account?error=${encodeURIComponent("Password must be at least 12 characters")}`,
    );
  }
  if (password !== confirm) {
    redirect(
      `/admin/account?error=${encodeURIComponent("Passwords do not match")}`,
    );
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    redirect(`/admin/account?error=${encodeURIComponent(error.message)}`);
  }
  redirect("/admin/account?success=1");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

// ---------------------------------------------------------------------------
// Posts
// ---------------------------------------------------------------------------
export async function savePost(formData: FormData) {
  const supabase = await requireUser();

  const id = String(formData.get("id") ?? "");
  const published = formData.get("published") === "on";
  const post = {
    title: String(formData.get("title") ?? "").trim(),
    slug: String(formData.get("slug") ?? "").trim(),
    excerpt: String(formData.get("excerpt") ?? "").trim(),
    content: String(formData.get("content") ?? ""),
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
      `/admin/posts/${id || "new"}?error=${encodeURIComponent("Title and slug are required")}`,
    );
  }

  let error;
  if (id) {
    const existing = await supabase
      .from("posts")
      .select("published_at")
      .eq("id", id)
      .maybeSingle();
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
    redirect(
      `/admin/posts/${id || "new"}?error=${encodeURIComponent(error.message)}`,
    );
  }

  revalidatePublic();
  revalidatePath(`/blog/${post.slug}`);
  redirect("/admin/posts");
}

// Quick publish/unpublish from the posts list, without opening the editor
export async function togglePostPublished(formData: FormData) {
  const supabase = await requireUser();
  const id = String(formData.get("id") ?? "");
  const publish = formData.get("publish") === "true";
  if (id) {
    const existing = await supabase
      .from("posts")
      .select("published_at")
      .eq("id", id)
      .maybeSingle();
    await supabase
      .from("posts")
      .update({
        published: publish,
        published_at: publish
          ? (existing.data?.published_at ?? new Date().toISOString())
          : null,
      })
      .eq("id", id);
  }
  revalidatePublic();
  revalidatePath("/admin/posts");
}

export async function deletePost(formData: FormData) {
  const supabase = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (id) {
    await supabase.from("posts").delete().eq("id", id);
  }
  revalidatePublic();
  redirect("/admin/posts");
}

// ---------------------------------------------------------------------------
// Site content (hero, contact, skills, SEO)
// ---------------------------------------------------------------------------
async function upsertSetting(key: string, value: unknown) {
  const supabase = await requireUser();
  const { error } = await supabase
    .from("site_settings")
    .upsert({ key, value }, { onConflict: "key" });
  if (error) {
    redirect(`/admin/content?error=${encodeURIComponent(error.message)}`);
  }
  revalidatePublic();
  redirect("/admin/content?success=1");
}

export async function saveHero(formData: FormData) {
  await upsertSetting("hero", {
    name: String(formData.get("name") ?? "").trim(),
    title: String(formData.get("title") ?? "").trim(),
    subtitle: String(formData.get("subtitle") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    image: String(formData.get("image") ?? "").trim(),
  });
}

export async function saveContact(formData: FormData) {
  const socials = [
    { name: "GitHub", icon: "github", url: String(formData.get("github") ?? "").trim() },
    { name: "LinkedIn", icon: "linkedin", url: String(formData.get("linkedin") ?? "").trim() },
    { name: "X", icon: "x", url: String(formData.get("x") ?? "").trim() },
  ].filter((s) => s.url.length > 0);

  await upsertSetting("contact", {
    email: String(formData.get("email") ?? "").trim(),
    availability: String(formData.get("availability") ?? "").trim(),
    responseTime: String(formData.get("responseTime") ?? "").trim(),
    socialLinks: socials,
  });
}

export async function saveMeta(formData: FormData) {
  await upsertSetting("metadata", {
    title: String(formData.get("title") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    author: String(formData.get("author") ?? "").trim(),
    keywords: String(formData.get("keywords") ?? "")
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean),
  });
}

export async function saveSections(formData: FormData) {
  await upsertSetting("sections", {
    projects: formData.get("projects") === "on",
    skills: formData.get("skills") === "on",
    blog: formData.get("blog") === "on",
    contact: formData.get("contact") === "on",
  });
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
      redirect(`/admin/content?error=${encodeURIComponent(ins.error.message)}`);
    }
  } else if (del.error) {
    redirect(`/admin/content?error=${encodeURIComponent(del.error.message)}`);
  }

  revalidatePublic();
  redirect("/admin/content?success=1");
}

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------
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
      `/admin/projects/${id || "new"}?error=${encodeURIComponent("Title is required")}`,
    );
  }

  const { error } = id
    ? await supabase.from("projects").update(project).eq("id", id)
    : await supabase.from("projects").insert(project);

  if (error) {
    redirect(
      `/admin/projects/${id || "new"}?error=${encodeURIComponent(error.message)}`,
    );
  }

  revalidatePublic();
  redirect("/admin/projects");
}

// Quick show/hide from the projects list, without opening the editor
export async function toggleProjectVisibility(formData: FormData) {
  const supabase = await requireUser();
  const id = String(formData.get("id") ?? "");
  const visible = formData.get("visible") === "true";
  if (id) {
    await supabase.from("projects").update({ visible }).eq("id", id);
  }
  revalidatePublic();
  revalidatePath("/admin/projects");
}

export async function deleteProject(formData: FormData) {
  const supabase = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (id) {
    await supabase.from("projects").delete().eq("id", id);
  }
  revalidatePublic();
  redirect("/admin/projects");
}
