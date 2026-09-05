import Image from "next/image";
import { Project } from "@/config/portfolio";
import { getIcon } from "@/components/ui/icons";

interface ProjectCardProps {
  project: Project;
  index: number;
}

export default function ProjectCard({ project, index }: ProjectCardProps) {
  const reversed = index % 2 === 1;

  return (
    <article
      className={`group flex flex-col gap-8 md:items-center md:gap-14 ${
        reversed ? "md:flex-row-reverse" : "md:flex-row"
      }`}
    >
      <a
        href={project.demoUrl ?? project.githubUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full overflow-hidden rounded-xl md:w-1/2"
        tabIndex={-1}
        aria-hidden="true"
      >
        <div className="relative aspect-[4/3] rounded-xl border border-border bg-muted">
          <Image
            alt={project.title}
            loading="lazy"
            fill
            sizes="(min-width: 1024px) 460px, (min-width: 768px) calc((100vw - 6.5rem) / 2), calc(100vw - 3rem)"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
            src={project.image}
          />
        </div>
      </a>

      <div className="w-full md:w-1/2">
        <span className="font-mono text-xs text-muted-foreground">
          {String(index + 1).padStart(2, "0")}
        </span>
        <h3 className="mt-3 text-2xl font-semibold">{project.title}</h3>
        <p className="mt-3 max-w-[48ch] leading-relaxed text-muted-foreground">
          {project.description}
        </p>

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

        <div className="mt-6 flex items-center gap-5 text-sm">
          {project.demoUrl && (
            <a
              href={project.demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-medium text-primary transition-opacity hover:opacity-80"
            >
              {getIcon("external-link", { className: "h-3.5 w-3.5" })}
              Visit
            </a>
          )}
          {project.githubUrl && (
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
            >
              {getIcon("github", { className: "h-3.5 w-3.5" })}
              Code
            </a>
          )}
          {project.docsUrl && (
            <a
              href={project.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
            >
              {getIcon("file-text", { className: "h-3.5 w-3.5" })}
              Docs
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
