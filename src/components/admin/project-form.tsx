"use client";

import { useState } from "react";
import { saveProject, deleteProject } from "@/app/admin/actions";
import ProjectMediaFields from "@/components/admin/project-media-fields";
import type { DbProject } from "@/lib/projects";
import { slugify } from "@/lib/slug";

const inputClass =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-ring";

const textareaClass =
  "w-full resize-y rounded-md border border-input bg-background p-3 text-sm leading-relaxed text-foreground outline-none transition-colors focus:border-ring";

interface ProjectFormProps {
  project?: DbProject;
  error?: string;
}

export default function ProjectForm({ project, error }: ProjectFormProps) {
  const [title, setTitle] = useState(project?.title ?? "");
  const [slug, setSlug] = useState(project?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(project));

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
          title="Project name shown on the homepage and case study"
        >
          <span className="text-muted-foreground">Title</span>
          <input
            name="title"
            required
            value={title}
            onChange={(event) => {
              const nextTitle = event.target.value;
              setTitle(nextTitle);
              if (!slugTouched) setSlug(slugify(nextTitle));
            }}
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
        title="The project's URL: yoursite.com/projects/<slug>. Auto-generated from the title; changing it later breaks old links"
      >
        <span className="text-muted-foreground">Slug</span>
        <input
          name="slug"
          required
          value={slug}
          onChange={(event) => {
            setSlugTouched(true);
            setSlug(slugify(event.target.value));
          }}
          className={`${inputClass} font-mono`}
        />
      </label>

      <label
        className="mt-5 flex flex-col gap-1.5 text-sm"
        title="Short blurb shown on the homepage and at the top of the case study"
      >
        <span className="text-muted-foreground">Description</span>
        <textarea
          name="description"
          rows={3}
          defaultValue={project?.description ?? ""}
          className={textareaClass}
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
          title="Live demo link — shows a 'Visit' button. Leave empty to hide"
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

      <p className="mt-10 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
        Case study
      </p>
      <p className="mt-2 max-w-[60ch] text-sm leading-relaxed text-muted-foreground">
        Markdown is supported. Leave a section empty to hide it on the public
        page. The homepage card still links to this project page either way.
      </p>

      <label
        className="mt-5 flex flex-col gap-1.5 text-sm"
        title="The situation, users, and constraint that made the work necessary"
      >
        <span className="text-muted-foreground">Problem and context</span>
        <textarea
          name="problem"
          rows={6}
          defaultValue={project?.problem ?? ""}
          className={textareaClass}
        />
      </label>
      <label
        className="mt-5 flex flex-col gap-1.5 text-sm"
        title="What you owned on this project"
      >
        <span className="text-muted-foreground">Your role</span>
        <textarea
          name="role"
          rows={4}
          defaultValue={project?.role ?? ""}
          className={textareaClass}
        />
      </label>
      <label
        className="mt-5 flex flex-col gap-1.5 text-sm"
        title="How it was built and the decisions that mattered"
      >
        <span className="text-muted-foreground">
          Architecture and technical decisions
        </span>
        <textarea
          name="architecture"
          rows={6}
          defaultValue={project?.architecture ?? ""}
          className={textareaClass}
        />
      </label>
      <label
        className="mt-5 flex flex-col gap-1.5 text-sm"
        title="What was hard and how you resolved it"
      >
        <span className="text-muted-foreground">Challenges and solutions</span>
        <textarea
          name="challenges"
          rows={6}
          defaultValue={project?.challenges ?? ""}
          className={textareaClass}
        />
      </label>
      <label
        className="mt-5 flex flex-col gap-1.5 text-sm"
        title="Outcomes, metrics, or what shipped"
      >
        <span className="text-muted-foreground">
          Results or measurable impact
        </span>
        <textarea
          name="results"
          rows={5}
          defaultValue={project?.results ?? ""}
          className={textareaClass}
        />
      </label>

      <ProjectMediaFields initial={project?.media} />

      <label
        className="mt-8 flex w-fit cursor-pointer items-center gap-2.5 text-sm"
        title="Untick to hide this project from the homepage and case study URL without deleting it"
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
