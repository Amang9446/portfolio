import Link from "next/link";
import { getAllDbProjects } from "@/lib/projects";
import { toggleProjectVisibility } from "../../actions";

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
            <div
              key={project.id}
              className="flex items-center justify-between gap-4 border-b border-border py-4 first:border-t"
            >
              <Link
                href={`/admin/projects/${project.id}`}
                className={`group min-w-0 flex-1 ${project.visible ? "" : "opacity-50"}`}
              >
                <p className="truncate font-medium transition-colors group-hover:text-primary">
                  {project.title}
                </p>
                <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">
                  /{project.slug}
                  {project.tags.length > 0 ? ` · ${project.tags.join(" · ")}` : ""}
                </p>
              </Link>
              <span className="shrink-0 font-mono text-xs text-muted-foreground">
                #{project.sort_order}
              </span>
              <form action={toggleProjectVisibility} className="shrink-0">
                <input type="hidden" name="id" value={project.id} />
                <input
                  type="hidden"
                  name="visible"
                  value={String(!project.visible)}
                />
                <button
                  type="submit"
                  title={
                    project.visible
                      ? "Shown on the homepage — click to hide"
                      : "Hidden from the homepage — click to show"
                  }
                  className={`rounded-md border px-2.5 py-1 font-mono text-xs transition-colors ${
                    project.visible
                      ? "border-primary/40 text-primary hover:bg-primary/5"
                      : "border-border text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  {project.visible ? "Visible" : "Hidden"}
                </button>
              </form>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
