import { createClient } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { portfolioConfig, type Project } from "@/config/portfolio";

export interface DbProject {
  id: string;
  title: string;
  description: string;
  image: string;
  demo_url: string | null;
  github_url: string | null;
  docs_url: string | null;
  tags: string[];
  sort_order: number;
  created_at: string;
  updated_at: string;
}

function toProject(row: DbProject): Project {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    image: row.image,
    demoUrl: row.demo_url ?? undefined,
    githubUrl: row.github_url ?? undefined,
    docsUrl: row.docs_url ?? undefined,
    tags: row.tags,
  };
}

// Projects from Supabase; falls back to the static config when the DB
// is unconfigured or empty so the site always renders.
export async function getProjects(): Promise<Project[]> {
  if (!isSupabaseConfigured()) return portfolioConfig.projects;
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) {
    console.error("Failed to load projects:", error.message);
    return portfolioConfig.projects;
  }
  if (!data || data.length === 0) return portfolioConfig.projects;
  return (data as unknown as DbProject[]).map(toProject);
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
  return data ?? [];
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
  return data;
}
