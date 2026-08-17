import {
  articleMarkdownPath,
  buildArticleMarkdown,
} from "@/lib/article-markdown";
import { absoluteUrl } from "@/lib/site-url";
import {
  getPublishedPosts,
  getPublishedPostsWithContent,
  type PostSummary,
} from "@/lib/posts";
import { getProjects } from "@/lib/projects";
import { getSiteContent } from "@/lib/settings";
import type { Project } from "@/config/portfolio";

function oneLine(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function linkLabel(name: string) {
  return oneLine(name).replaceAll("[", "(").replaceAll("]", ")");
}

function linkItem(name: string, url: string, note?: string) {
  const label = linkLabel(name);
  const details = note ? oneLine(note) : "";
  return details ? `- [${label}](${url}): ${details}` : `- [${label}](${url})`;
}

function projectUrl(project: Project) {
  return (
    project.githubUrl ??
    project.docsUrl ??
    project.demoUrl ??
    absoluteUrl("/#projects")
  );
}

function writingLinks(posts: PostSummary[]) {
  return posts.map((post) =>
    linkItem(
      post.title,
      absoluteUrl(articleMarkdownPath(post.slug)),
      post.excerpt || undefined,
    ),
  );
}

function projectLinks(projects: Project[]) {
  return projects.map((project) =>
    linkItem(project.title, projectUrl(project), project.description),
  );
}

export async function buildLlmsTxt() {
  const [site, projects, posts] = await Promise.all([
    getSiteContent(),
    getProjects(),
    getPublishedPosts(),
  ]);

  const { hero, contact, metadata, skills, sections } = site;
  const skillNames = skills.map((skill) => skill.name).join(", ");

  const lines = [
    `# ${hero.name}`,
    "",
    `> ${oneLine(metadata.description)}`,
    "",
    oneLine(hero.description),
    "",
    `${hero.name} is a ${hero.title} (${hero.subtitle}). Contact: ${contact.email}. ${contact.availability} for new work. ${contact.responseTime}.`,
  ];

  if (skillNames) {
    lines.push("", `Skills: ${skillNames}.`);
  }

  if (sections.blog) {
    lines.push(
      "",
      "Writing is Markdown at `/blog/<slug>.md`. Prefer those URLs over the HTML pages.",
    );
  }

  const pages = [linkItem("Home", absoluteUrl("/"), "Portfolio homepage")];

  if (sections.blog) {
    pages.push(
      linkItem(
        "Blog",
        absoluteUrl("/blog"),
        "Notes on React Native, web development, and open source",
      ),
    );
  }

  if (sections.contact) {
    pages.push(linkItem("Contact", absoluteUrl("/#contact"), contact.email));
  }

  lines.push("", "## Pages", "", ...pages);

  if (sections.blog && posts.length > 0) {
    lines.push("", "## Writing", "", ...writingLinks(posts));
  }

  if (sections.projects && projects.length > 0) {
    lines.push("", "## Projects", "", ...projectLinks(projects));
  }

  const optional = [
    linkItem(
      "Full writing as Markdown",
      absoluteUrl("/llms-full.txt"),
      "All published articles concatenated",
    ),
    ...contact.socialLinks.map((link) => linkItem(link.name, link.url)),
  ];

  lines.push("", "## Optional", "", ...optional);

  return `${lines.join("\n")}\n`;
}

export async function buildLlmsFullTxt() {
  const [site, posts] = await Promise.all([
    getSiteContent(),
    getPublishedPostsWithContent(),
  ]);

  const header = [
    `# ${site.hero.name}`,
    "",
    `> ${oneLine(site.metadata.description)}`,
    "",
    oneLine(site.hero.description),
    "",
  ];

  if (!site.sections.blog || posts.length === 0) {
    return `${header.join("\n")}No published writing yet.\n`;
  }

  const articles = posts.map((post) =>
    buildArticleMarkdown(post, site.metadata.author),
  );

  return `${header.join("\n")}\n${articles.join("\n---\n\n")}\n`;
}
