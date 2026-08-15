import { NextResponse } from "next/server";
import {
  buildCaseStudyMarkdown,
  caseStudyMarkdownPath,
  markdownHeaders,
  projectPath,
} from "@/lib/case-study-markdown";
import { getProjectBySlug, getProjects } from "@/lib/projects";
import { getSiteContent } from "@/lib/settings";

export const revalidate = 60;

export async function generateStaticParams() {
  const projects = await getProjects();
  return projects
    .filter((project) => project.slug)
    .map((project) => ({ slug: project.slug }));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const [project, site] = await Promise.all([
    getProjectBySlug(slug),
    getSiteContent(),
  ]);

  if (!project) {
    return new NextResponse("Not found\n", {
      status: 404,
      headers: markdownHeaders,
    });
  }

  const htmlPath = projectPath(project.slug);
  const markdownPath = caseStudyMarkdownPath(project.slug);

  return new NextResponse(
    buildCaseStudyMarkdown(project, site.metadata.author),
    {
      headers: {
        ...markdownHeaders,
        Link: `<${htmlPath}>; rel="canonical", <${markdownPath}>; rel="alternate"; type="text/markdown", </llms.txt>; rel="describedby"`,
      },
    },
  );
}
