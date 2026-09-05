/**
 * Static fallback content.
 *
 * The site is DB-first: everything here is overridden by Supabase once
 * `site_settings`, `skills`, and `projects` have rows. It serves two purposes:
 *
 *   1. A fresh clone renders a complete, coherent site with no database
 *      configured at all.
 *   2. It is the safety net if Supabase is unreachable. That matters more than
 *      it looks: an ISR revalidation that hits a database error would otherwise
 *      cache whatever is written here and serve it publicly.
 *
 * Because of (2), a real deployment wants its own content here — but the repo
 * itself should stay generic for anyone forking it. `NEXT_PUBLIC_PORTFOLIO_CONFIG`
 * squares that circle: set it to a JSON object in your deployment environment
 * and it is deep-merged over the defaults below. See `.env.example`.
 *
 * Using this as a template? Edit the defaults below, or set that variable.
 * Once the admin dashboard is up, manage content there instead.
 */

export interface Project {
  id: string;
  title: string;
  description: string;
  image: string;
  demoUrl?: string;
  githubUrl?: string;
  docsUrl?: string;
  tags: string[];
}

export interface Skill {
  name: string;
  category: "tech" | "tools";
}

export interface SocialLink {
  name: string;
  url: string;
  icon: string;
}

export interface HeroConfig {
  name: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
}

export interface ContactConfig {
  email: string;
  availability: string;
  responseTime: string;
  socialLinks: SocialLink[];
}

export interface PortfolioConfig {
  hero: HeroConfig;
  projects: Project[];
  skills: Skill[];
  contact: ContactConfig;
  metadata: {
    title: string;
    description: string;
    author: string;
    keywords: string[];
    twitterHandle: string;
  };
}

/** Generic defaults. Safe to publish; meaningless to any particular person. */
export const defaultConfig: PortfolioConfig = {
  hero: {
    name: "Your Name",
    title: "Software Engineer",
    subtitle: "Mobile · Open Source",
    description:
      "I build mobile and web applications, and contribute to open source along the way. Replace this copy in src/config/portfolio.ts, or manage it from the admin dashboard.",
    image: "",
  },
  projects: [
    {
      id: "example-project",
      title: "Example Project",
      description:
        "A short description of what this project does and why it is interesting. Two lines is plenty.",
      image: "",
      demoUrl: "https://example.com",
      githubUrl: "https://github.com/you/example-project",
      tags: ["TypeScript", "React"],
    },
    {
      id: "second-project",
      title: "Second Project",
      description:
        "Another placeholder entry, so the projects grid has something to lay out on a fresh clone.",
      image: "",
      githubUrl: "https://github.com/you/second-project",
      tags: ["Next.js", "Postgres"],
    },
  ],
  skills: [
    { name: "TypeScript", category: "tech" },
    { name: "React", category: "tech" },
    { name: "Next.js", category: "tech" },
    { name: "Node.js", category: "tech" },
    { name: "Postgres", category: "tech" },
    { name: "Git", category: "tools" },
    { name: "Docker", category: "tools" },
    { name: "Figma", category: "tools" },
  ],
  contact: {
    email: "you@example.com",
    availability: "Available",
    responseTime: "Usually responds within 24 hours",
    socialLinks: [
      { name: "GitHub", url: "https://github.com/you", icon: "github" },
      {
        name: "LinkedIn",
        url: "https://linkedin.com/in/you",
        icon: "linkedin",
      },
      { name: "X", url: "https://x.com/you", icon: "x" },
    ],
  },
  metadata: {
    title: "Your Name — Software Engineer",
    description:
      "Software engineer building mobile and web applications. Replace this description in src/config/portfolio.ts, or from the admin dashboard.",
    author: "Your Name",
    keywords: [
      "Software Engineer",
      "TypeScript",
      "React",
      "Next.js",
      "Portfolio",
    ],
    twitterHandle: "",
  },
};

type Overrides = {
  [K in keyof PortfolioConfig]?: PortfolioConfig[K] extends unknown[]
    ? PortfolioConfig[K]
    : Partial<PortfolioConfig[K]>;
};

/**
 * Merge a partial override over the defaults.
 *
 * Objects (`hero`, `contact`, `metadata`) merge field by field, so an override
 * can set just a name. Arrays (`projects`, `skills`, `socialLinks`) replace
 * wholesale — merging them element-wise would make it impossible to shorten a
 * list, which is the more common intent.
 */
export function mergePortfolioConfig(
  base: PortfolioConfig,
  overrides: Overrides | null | undefined,
): PortfolioConfig {
  if (!overrides) return base;

  return {
    hero: { ...base.hero, ...overrides.hero },
    projects: overrides.projects ?? base.projects,
    skills: overrides.skills ?? base.skills,
    contact: { ...base.contact, ...overrides.contact },
    metadata: { ...base.metadata, ...overrides.metadata },
  };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Keep only the keys whose shape matches the config, dropping anything else
 * with a warning.
 *
 * Syntactically valid but structurally wrong input is the dangerous case: a
 * `metadata.keywords` given as a string would survive a bare `JSON.parse` and
 * then throw inside `generateMetadata` when `.join()` is called on it, failing
 * the build. Validating here keeps a bad env var to a warning.
 */
function validateOverrides(input: Record<string, unknown>): Overrides {
  const result: Record<string, unknown> = {};

  const reject = (key: string, expected: string) =>
    console.warn(
      `[portfolio] NEXT_PUBLIC_PORTFOLIO_CONFIG: "${key}" must be ${expected}; ignoring it.`,
    );

  for (const key of ["hero", "contact", "metadata"] as const) {
    if (!(key in input)) continue;
    if (!isPlainObject(input[key])) {
      reject(key, "an object");
      continue;
    }
    // Array-valued fields inside these objects have the same hazard.
    const section = input[key] as Record<string, unknown>;
    const arrayFields =
      key === "contact"
        ? ["socialLinks"]
        : key === "metadata"
          ? ["keywords"]
          : [];
    const cleaned: Record<string, unknown> = {};
    for (const [field, value] of Object.entries(section)) {
      if (arrayFields.includes(field) && !Array.isArray(value)) {
        reject(`${key}.${field}`, "an array");
        continue;
      }
      cleaned[field] = value;
    }
    result[key] = cleaned;
  }

  for (const key of ["projects", "skills"] as const) {
    if (!(key in input)) continue;
    if (!Array.isArray(input[key])) {
      reject(key, "an array");
      continue;
    }
    result[key] = input[key];
  }

  return result as Overrides;
}

/**
 * Parse the deployment override. Malformed or wrongly shaped input falls back
 * to the defaults with a warning rather than failing the build — a bad
 * variable should not take the whole site down.
 */
export function parsePortfolioOverrides(
  raw: string | undefined,
): Overrides | null {
  const value = raw?.trim();
  if (!value) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch (error) {
    console.warn(
      "[portfolio] NEXT_PUBLIC_PORTFOLIO_CONFIG is not valid JSON, using defaults:",
      error instanceof Error ? error.message : error,
    );
    return null;
  }

  if (!isPlainObject(parsed)) {
    console.warn(
      "[portfolio] NEXT_PUBLIC_PORTFOLIO_CONFIG must be a JSON object, using defaults.",
    );
    return null;
  }

  return validateOverrides(parsed);
}

export const portfolioConfig: PortfolioConfig = mergePortfolioConfig(
  defaultConfig,
  parsePortfolioOverrides(process.env.NEXT_PUBLIC_PORTFOLIO_CONFIG),
);
