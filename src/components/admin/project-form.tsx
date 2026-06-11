"use client";

import { saveProject, deleteProject } from "@/app/admin/actions";
import type { DbProject } from "@/lib/projects";

const inputClass =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-ring";

interface ProjectFormProps {
  project?: DbProject;
  error?: string;
}

export default function ProjectForm({ project, error }: ProjectFormProps) {
  return (
    <form action={saveProject}>
      {project && <input type="hidden" name="id" value={project.id} />}

      {error && (
        <p className="mb-6 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        <label
          className="flex flex-col gap-1.5 text-sm"
          title="Project name shown on the homepage Projects section"
        >
          <span className="text-muted-foreground">Title</span>
          <input
            name="title"
            required
            defaultValue={project?.title ?? ""}
            className={inputClass}
          />
        </label>
        <label
          className="flex flex-col gap-1.5 text-sm"
          title="Position on the homepage: lower numbers appear first (0 = top)"
        >
          <span className="text-muted-foreground">Sort order</span>
          <input
            name="sort_order"
            type="number"
            defaultValue={project?.sort_order ?? 0}
            className={inputClass}
          />
        </label>
      </div>

      <label
        className="mt-5 flex flex-col gap-1.5 text-sm"
        title="Short blurb shown next to the project image (1–2 sentences)"
      >
        <span className="text-muted-foreground">Description</span>
        <textarea
          name="description"
          rows={3}
          defaultValue={project?.description ?? ""}
          className="w-full resize-y rounded-md border border-input bg-background p-3 text-sm leading-relaxed text-foreground outline-none transition-colors focus:border-ring"
        />
      </label>

      <label
        className="mt-5 flex flex-col gap-1.5 text-sm"
        title="Screenshot URL (e.g. Cloudinary). Shown at 4:3 next to the description"
      >
        <span className="text-muted-foreground">Image URL</span>
        <input
          name="image"
          type="url"
          defaultValue={project?.image ?? ""}
          className={`${inputClass} font-mono`}
        />
      </label>

      <div className="mt-5 grid gap-5 md:grid-cols-3">
        <label
          className="flex flex-col gap-1.5 text-sm"
          title="Live demo link — shows a 'Demo' button. Leave empty to hide"
        >
          <span className="text-muted-foreground">Demo URL</span>
          <input
            name="demo_url"
            type="url"
            defaultValue={project?.demo_url ?? ""}
            className={`${inputClass} font-mono`}
          />
        </label>
        <label
          className="flex flex-col gap-1.5 text-sm"
          title="Repository link — shows a 'Code' button. Leave empty to hide"
        >
          <span className="text-muted-foreground">GitHub URL</span>
          <input
            name="github_url"
            type="url"
            defaultValue={project?.github_url ?? ""}
            className={`${inputClass} font-mono`}
          />
        </label>
        <label
          className="flex flex-col gap-1.5 text-sm"
          title="Documentation/README link — shows a 'Docs' button. Leave empty to hide"
        >
          <span className="text-muted-foreground">Docs URL</span>
          <input
            name="docs_url"
            type="url"
            defaultValue={project?.docs_url ?? ""}
            className={`${inputClass} font-mono`}
          />
        </label>
      </div>

      <label
        className="mt-5 flex flex-col gap-1.5 text-sm"
        title="Tech stack labels shown under the description, e.g. React Native, Expo"
      >
        <span className="text-muted-foreground">Tags (comma-separated)</span>
        <input
          name="tags"
          defaultValue={project?.tags.join(", ") ?? ""}
          placeholder="React Native, TypeScript, Expo"
          className={inputClass}
        />
      </label>

      <label
        className="mt-5 flex w-fit cursor-pointer items-center gap-2.5 text-sm"
        title="Untick to hide this project from the homepage without deleting it"
      >
        <input
          name="visible"
          type="checkbox"
          defaultChecked={project?.visible ?? true}
          className="h-4 w-4 accent-primary"
        />
        <span>Visible on the homepage</span>
      </label>

      <div className="mt-6 flex items-center justify-end gap-3">
        {project && (
          <button
            type="submit"
            formAction={deleteProject}
            formNoValidate
            onClick={(e) => {
              if (!confirm("Delete this project permanently?"))
                e.preventDefault();
            }}
            className="rounded-md border border-destructive/40 px-4 py-2 text-sm text-destructive transition-colors hover:bg-destructive/5"
          >
            Delete
          </button>
        )}
        <button
          type="submit"
          className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Save
        </button>
      </div>
    </form>
  );
}
