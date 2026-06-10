import Link from "next/link";
import { getAllDbProjects } from "@/lib/projects";

export default async function AdminProjectsPage() {
  const projects = await getAllDbProjects();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Projects</h1>
        <Link
          href="/admin/projects/new"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          New project
        </Link>
      </div>

      {projects.length === 0 ? (
        <p className="mt-10 max-w-[60ch] leading-relaxed text-muted-foreground">
          No projects in the database yet — the site is showing the static
          config fallback. Add projects here to take over.
        </p>
      ) : (
        <div className="mt-8 flex flex-col">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/admin/projects/${project.id}`}
              className="group flex items-center justify-between gap-4 border-b border-border py-4 first:border-t"
            >
              <div className="min-w-0">
                <p className="truncate font-medium transition-colors group-hover:text-primary">
                  {project.title}
                </p>
                <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">
                  {project.tags.join(" · ")}
                </p>
              </div>
              <span className="shrink-0 font-mono text-xs text-muted-foreground">
                #{project.sort_order}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
