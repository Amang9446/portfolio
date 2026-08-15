import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import NavBar from "@/components/layout/nav-bar";
import Footer from "@/components/layout/Footer";
import MarkdownContent from "@/components/markdown/markdown-content";
import ArticleMarkdownButton from "@/components/posts/article-markdown-button";
import PostCover from "@/components/posts/post-cover";
import CaseStudyMedia from "@/components/projects/case-study-media";
import { getIcon } from "@/components/ui/icons";
import {
  CASE_STUDY_SECTIONS,
  caseStudyMarkdownPath,
  projectPath,
} from "@/lib/case-study-markdown";
import { getProjectBySlug, getProjects } from "@/lib/projects";
import { getSiteContent } from "@/lib/settings";
import { absoluteUrl } from "@/lib/site-url";

export const revalidate = 60;

export async function generateStaticParams() {
  const projects = await getProjects();
  return projects
    .filter((project) => project.slug)
    .map((project) => ({ slug: project.slug }));
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) return { title: "Project not found | Aman" };

  const title = `${project.title} | Aman`;
  const description = project.description;
  const path = projectPath(project.slug);
  const pageUrl = absoluteUrl(path);
  const imageUrl = project.image.trim();

  return {
    title,
    description,
    alternates: {
      canonical: path,
      types: {
        "text/markdown": caseStudyMarkdownPath(project.slug),
      },
    },
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: "Aman Portfolio",
      type: "article",
      images: imageUrl
        ? [{ url: imageUrl, alt: project.title }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      creator: "@amanunreal",
      images: imageUrl ? [imageUrl] : undefined,
    },
  };
}

export default async function ProjectCaseStudyPage({ params }: PageProps) {
  const { slug } = await params;
  const [project, site, projects] = await Promise.all([
    getProjectBySlug(slug),
    getSiteContent(),
    getProjects(),
  ]);
  if (!project) notFound();

  const sections = CASE_STUDY_SECTIONS.filter((section) =>
    project[section.key].trim(),
  );
  const moreProjects = projects
    .filter((item) => item.id !== project.id)
    .slice(0, 3);

  return (
    <main className="flex min-h-screen flex-col bg-background text-foreground">
      <NavBar socialLinks={site.contact.socialLinks} sections={site.sections} />
      <article className="mx-auto w-full max-w-5xl flex-1 px-6 py-20 md:py-28">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center justify-between gap-4">
            <Link
              href="/#projects"
              className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
            >
              &larr; Projects
            </Link>
            <ArticleMarkdownButton href={caseStudyMarkdownPath(project.slug)} />
          </div>
          <h1 className="mt-6 text-3xl font-semibold leading-tight md:text-4xl">
            {project.title}
          </h1>
          {project.description ? (
            <p className="mt-4 max-w-[48ch] leading-relaxed text-muted-foreground">
              {project.description}
            </p>
          ) : null}

          {project.tags.length > 0 ? (
            <ul className="mt-5 flex flex-wrap gap-x-3 gap-y-1.5">
              {project.tags.map((tag) => (
                <li
                  key={tag}
                  className="font-mono text-xs text-muted-foreground after:ml-3 after:text-border after:content-['·'] last:after:content-none"
                >
                  {tag}
                </li>
              ))}
            </ul>
          ) : null}

          <div className="mt-6 flex flex-wrap items-center gap-5 text-sm">
            {project.demoUrl ? (
              <a
                href={project.demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-medium text-primary transition-opacity hover:opacity-80"
              >
                {getIcon("external-link", { className: "h-3.5 w-3.5" })}
                Visit
              </a>
            ) : null}
            {project.githubUrl ? (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
              >
                {getIcon("github", { className: "h-3.5 w-3.5" })}
                Code
              </a>
            ) : null}
            {project.docsUrl ? (
              <a
                href={project.docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
              >
                {getIcon("file-text", { className: "h-3.5 w-3.5" })}
                Docs
              </a>
            ) : null}
          </div>
        </div>

        <PostCover
          post={{
            title: project.title,
            cover_image_url: project.image,
            cover_image_alt: project.title,
          }}
          ratio="wide"
          fallback="none"
          className="mt-10 md:mt-12"
          eager
        />

        <div className="mx-auto mt-12 max-w-3xl md:mt-16">
          {sections.map((section) => (
            <section
              key={section.key}
              className="mt-14 first:mt-0 md:mt-16 first:md:mt-0"
            >
              <h2 className="text-xl font-semibold md:text-2xl">
                {section.title}
              </h2>
              <div className="markdown mt-5">
                <MarkdownContent content={project[section.key]} />
              </div>
            </section>
          ))}

          <CaseStudyMedia items={project.media} title={project.title} />
        </div>
      </article>

      {moreProjects.length > 0 ? (
        <section
          aria-labelledby="more-work-heading"
          className="mx-auto w-full max-w-5xl border-t border-border px-6 pt-16 pb-20 md:pt-20 md:pb-28"
        >
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">
            Selected work
          </p>
          <h2 id="more-work-heading" className="mt-3 text-2xl font-semibold">
            More projects
          </h2>
          <ul className="mt-10 flex flex-col">
            {moreProjects.map((item) => (
              <li
                key={item.id}
                className="border-b border-border py-5 first:border-t"
              >
                <Link
                  href={projectPath(item.slug)}
                  className="group block"
                >
                  <p className="font-medium transition-colors group-hover:text-primary">
                    {item.title}
                  </p>
                  <p className="mt-1 max-w-[52ch] text-sm leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <Footer author={site.metadata.author} />
    </main>
  );
}
