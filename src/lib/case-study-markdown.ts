import type { ProjectDetail } from "@/lib/projects";
import { absoluteUrl } from "@/lib/site-url";

export const markdownHeaders = {
  "Content-Type": "text/markdown; charset=utf-8",
} as const;

export function projectPath(slug: string) {
  return `/projects/${encodeURIComponent(slug)}`;
}

export function caseStudyMarkdownPath(slug: string) {
  return `/projects/${encodeURIComponent(slug)}.md`;
}

function oneLine(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeMarkdown(value: string) {
  return value.replace(/\r\n/g, "\n").trim();
}

export const CASE_STUDY_SECTIONS = [
  { key: "problem", title: "Problem and context" },
  { key: "role", title: "Your role" },
  { key: "architecture", title: "Architecture and technical decisions" },
  { key: "challenges", title: "Challenges and solutions" },
  { key: "results", title: "Results or measurable impact" },
] as const;

export function buildCaseStudyMarkdown(project: ProjectDetail, author: string) {
  const htmlUrl = absoluteUrl(projectPath(project.slug));
  const lines = [`# ${oneLine(project.title)}`, ""];
  const description = oneLine(project.description);

  if (description) {
    lines.push(`> ${description}`, "");
  }

  lines.push(`- Source: ${htmlUrl}`, `- Author: ${author}`);
  if (project.tags.length > 0) {
    lines.push(`- Stack: ${project.tags.join(", ")}`);
  }
  if (project.demoUrl) lines.push(`- Demo: ${project.demoUrl}`);
  if (project.githubUrl) lines.push(`- Code: ${project.githubUrl}`);
  if (project.docsUrl) lines.push(`- Docs: ${project.docsUrl}`);
  lines.push("");

  if (project.image.trim()) {
    lines.push(`![${oneLine(project.title)}](${project.image.trim()})`, "");
  }

  for (const section of CASE_STUDY_SECTIONS) {
    const body = normalizeMarkdown(String(project[section.key] ?? ""));
    if (!body) continue;
    lines.push(`## ${section.title}`, "", body, "");
  }

  if (project.media.length > 0) {
    lines.push("## Screenshots, diagrams, videos, and links", "");
    for (const item of project.media) {
      if (item.kind === "image") {
        const alt = oneLine(item.alt || item.caption || project.title);
        lines.push(`![${alt}](${item.url})`);
        if (item.caption) lines.push("", oneLine(item.caption));
        lines.push("");
        continue;
      }
      const label =
        oneLine(item.label || item.caption || item.url) || item.url;
      lines.push(`- [${label}](${item.url})`);
    }
    lines.push("");
  }

  return lines.join("\n");
}
