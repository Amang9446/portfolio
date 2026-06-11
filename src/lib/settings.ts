import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  portfolioConfig,
  type HeroConfig,
  type ContactConfig,
  type Skill,
} from "@/config/portfolio";

export interface SiteMetadata {
  title: string;
  description: string;
  author: string;
  keywords: string[];
}

// Which public sections render. Hiding "blog" removes it from the nav and
// returns 404 for /blog; the other keys hide homepage sections.
export interface SectionVisibility {
  projects: boolean;
  skills: boolean;
  blog: boolean;
  contact: boolean;
}

export interface SiteContent {
  hero: HeroConfig;
  contact: ContactConfig;
  metadata: SiteMetadata;
  skills: Skill[];
  sections: SectionVisibility;
}

const allSectionsVisible: SectionVisibility = {
  projects: true,
  skills: true,
  blog: true,
  contact: true,
};

const fallback: SiteContent = {
  hero: portfolioConfig.hero,
  contact: portfolioConfig.contact,
  metadata: portfolioConfig.metadata,
  skills: portfolioConfig.skills,
  sections: allSectionsVisible,
};

// All public site content, DB-first with the static config as fallback so
// the site always renders even when Supabase is unconfigured or down.
// cache() dedupes the layout (generateMetadata) + page calls per request.
export const getSiteContent = cache(async (): Promise<SiteContent> => {
  if (!isSupabaseConfigured()) return fallback;

  const supabase = createPublicClient();
  const [settingsRes, skillsRes] = await Promise.all([
    supabase.from("site_settings").select("key, value"),
    supabase
      .from("skills")
      .select("name, category, sort_order")
      .order("sort_order", { ascending: true }),
  ]);

  if (settingsRes.error) {
    console.error("Failed to load site settings:", settingsRes.error.message);
  }
  if (skillsRes.error) {
    console.error("Failed to load skills:", skillsRes.error.message);
  }

  const settingsRows = (settingsRes.data ?? []) as {
    key: string;
    value: Record<string, unknown>;
  }[];
  const byKey = new Map(settingsRows.map((row) => [row.key, row.value]));

  const skillRows = (skillsRes.data ?? []) as {
    name: string;
    category: Skill["category"];
  }[];
  const skills =
    skillRows.length > 0
      ? skillRows.map((s) => ({ name: s.name, category: s.category }))
      : fallback.skills;

  return {
    hero: { ...fallback.hero, ...(byKey.get("hero") ?? {}) },
    contact: { ...fallback.contact, ...(byKey.get("contact") ?? {}) },
    metadata: { ...fallback.metadata, ...(byKey.get("metadata") ?? {}) },
    skills,
    sections: { ...allSectionsVisible, ...(byKey.get("sections") ?? {}) },
  };
});
