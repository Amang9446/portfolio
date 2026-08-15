import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { portfolioConfig, type Project } from "@/config/portfolio";
import { projectCacheTag, projectsCacheTag } from "@/lib/cache";
import {
  hasCaseStudyContent,
  parseProjectMedia,
  type ProjectMediaItem,
} from "@/lib/project-media";

export interface DbProject {
  id: string;
  slug: string;
  title: string;
  description: string;
  image: string;
  demo_url: string | null;
  github_url: string | null;
  docs_url: string | null;
  tags: string[];
  sort_order: number;
  visible: boolean;
  role: string;
  problem: string;
  architecture: string;
  challenges: string;
  results: string;
  media: ProjectMediaItem[];
  created_at: string;
  updated_at: string;
}

export interface ProjectDetail extends Project {
  role: string;
  problem: string;
  architecture: string;
  challenges: string;
  results: string;
  media: ProjectMediaItem[];
  updatedAt: string;
}

function normalizeDbProject(row: Record<string, unknown>): DbProject {
  return {
    id: String(row.id ?? ""),
    slug: String(row.slug ?? ""),
    title: String(row.title ?? ""),
    description: String(row.description ?? ""),
    image: String(row.image ?? ""),
    demo_url: row.demo_url ? String(row.demo_url) : null,
    github_url: row.github_url ? String(row.github_url) : null,
    docs_url: row.docs_url ? String(row.docs_url) : null,
    tags: Array.isArray(row.tags)
      ? row.tags.map((tag) => String(tag)).filter(Boolean)
      : [],
    sort_order: Number(row.sort_order ?? 0) || 0,
    visible: Boolean(row.visible),
    role: String(row.role ?? ""),
    problem: String(row.problem ?? ""),
    architecture: String(row.architecture ?? ""),
    challenges: String(row.challenges ?? ""),
    results: String(row.results ?? ""),
    media: parseProjectMedia(row.media),
    created_at: String(row.created_at ?? ""),
    updated_at: String(row.updated_at ?? ""),
  };
}

function toProject(row: DbProject): Project {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    image: row.image,
    demoUrl: row.demo_url ?? undefined,
    githubUrl: row.github_url ?? undefined,
    docsUrl: row.docs_url ?? undefined,
    tags: row.tags,
    role: row.role,
    problem: row.problem,
    architecture: row.architecture,
    challenges: row.challenges,
    results: row.results,
    media: row.media,
  };
}

function toDetail(row: DbProject): ProjectDetail {
  return {
    ...toProject(row),
    role: row.role,
    problem: row.problem,
    architecture: row.architecture,
    challenges: row.challenges,
    results: row.results,
    media: row.media,
    updatedAt: row.updated_at,
  };
}

function toDetailFromConfig(project: Project): ProjectDetail {
  const media = parseProjectMedia(project.media ?? []);
  return {
    ...project,
    role: project.role ?? "",
    problem: project.problem ?? "",
    architecture: project.architecture ?? "",
    challenges: project.challenges ?? "",
    results: project.results ?? "",
    media,
    updatedAt: "",
  };
}

export function projectHasCaseStudy(project: Project) {
  return hasCaseStudyContent(project);
}

async function tableHasProjects(
  supabase: ReturnType<typeof createPublicClient>,
) {
  const { data, error } = await supabase.rpc("has_any_projects");
  if (error) {
    console.error("Failed to check projects catalog:", error.message);
    return null;
  }
  return Boolean(data);
}

async function fetchVisibleProjects(): Promise<Project[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("visible", true)
    .order("sort_order", { ascending: true });
  if (error) {
    console.error("Failed to load projects:", error.message);
    return [];
  }
  if (data && data.length > 0) {
    return data.map((row) =>
      toProject(normalizeDbProject(row as Record<string, unknown>)),
    );
  }

  // RLS hides invisible rows from this anon client, so an empty select is
  // ambiguous. Fall back to static config only when the table has no rows.
  const hasRows = await tableHasProjects(supabase);
  if (hasRows === null || hasRows) return [];
  return portfolioConfig.projects;
}

async function fetchVisibleProjectBySlug(
  slug: string,
): Promise<ProjectDetail | null> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("slug", slug)
    .eq("visible", true)
    .maybeSingle();
  if (error) {
    console.error("Failed to load project:", error.message);
    return null;
  }
  if (data) {
    return toDetail(normalizeDbProject(data as Record<string, unknown>));
  }

  const hasRows = await tableHasProjects(supabase);
  if (hasRows === null || hasRows) return null;
  const fallback = portfolioConfig.projects.find((project) => project.slug === slug);
  return fallback ? toDetailFromConfig(fallback) : null;
}

// Projects from Supabase. Static config is used only when the DB is
// unconfigured or the table is truly empty — never on query errors, so a
// blip cannot republish hidden CMS projects.
export async function getProjects(): Promise<Project[]> {
  if (!isSupabaseConfigured()) return portfolioConfig.projects;
  return unstable_cache(fetchVisibleProjects, ["visible-projects"], {
    tags: [projectsCacheTag()],
    revalidate: 60,
  })();
}

export async function getProjectBySlug(
  slug: string,
): Promise<ProjectDetail | null> {
  if (!isSupabaseConfigured()) {
    const project = portfolioConfig.projects.find((item) => item.slug === slug);
    return project ? toDetailFromConfig(project) : null;
  }
  return unstable_cache(
    () => fetchVisibleProjectBySlug(slug),
    ["project-by-slug", slug],
    { tags: [projectsCacheTag(), projectCacheTag(slug)], revalidate: 60 },
  )();
}

export async function getAllDbProjects(): Promise<DbProject[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) {
    console.error("Failed to load projects:", error.message);
    return [];
  }
  return (data ?? []).map((row) =>
    normalizeDbProject(row as Record<string, unknown>),
  );
}

export async function getDbProjectById(id: string): Promise<DbProject | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    console.error("Failed to load project:", error.message);
    return null;
  }
  return data ? normalizeDbProject(data as Record<string, unknown>) : null;
}
