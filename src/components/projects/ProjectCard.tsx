import Image from "next/image";
import { Project } from "@/config/portfolio";
import { getIcon } from "@/components/ui/icons";

interface ProjectCardProps {
  project: Project;
  delay?: number;
}

export default function ProjectCard({ project, delay = 0 }: ProjectCardProps) {
  return (
    <div
      className="transition-all duration-500 ease-out opacity-100 translate-y-0"
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="rounded-xl text-card-foreground shadow group relative overflow-hidden transition-all duration-500 border border-border/50 hover:border-primary/20 bg-card/30 h-full hover:bg-card/50">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,var(--tw-gradient-stops))] from-primary/0 via-primary/0 to-primary/0 group-hover:from-primary/5 group-hover:via-primary/2 group-hover:to-primary/0 transition-all duration-500 opacity-0 group-hover:opacity-100 pointer-events-none"></div>

        <div className="relative aspect-video overflow-hidden bg-muted/50 cursor-zoom-in group/image">
          <Image
            alt={project.title}
            loading="lazy"
            decoding="async"
            className="object-cover transition-all duration-500 group-hover:brightness-95 group-hover/image:scale-105"
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            src={project.image}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
        </div>

        <div className="p-4 md:p-6 pointer-events-auto">
          <div className="space-y-3 mb-2 md:mb-4">
            <h3 className="text-base md:text-xl font-semibold transition-colors duration-200">
              {project.title}
            </h3>
            <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
              {project.description}
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            {project.demoUrl && (
              <a
                className="flex items-center gap-1 py-1 px-1.5 text-xs font-medium text-primary bg-primary/10 hover:bg-primary/15 rounded-lg transition-colors duration-200"
                href={project.demoUrl}
                rel="noopener noreferrer"
                target="_blank"
              >
                {getIcon("external-link")}
                Demo
              </a>
            )}

            {project.githubUrl && (
              <a
                className="flex items-center gap-1 py-1 px-1.5 text-xs font-medium text-primary bg-primary/10 hover:bg-primary/15 rounded-lg transition-colors duration-200"
                href={project.githubUrl}
                rel="noopener noreferrer"
                target="_blank"
              >
                {getIcon("github")}
                GitHub
              </a>
            )}

            {project.docsUrl && (
              <a
                className="flex items-center gap-1 py-1 px-1.5 text-xs font-medium text-primary bg-primary/10 hover:bg-primary/15 rounded-lg transition-colors duration-200"
                href={project.docsUrl}
                rel="noopener noreferrer"
                target="_blank"
              >
                {getIcon("file-text")}
                Docs
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
