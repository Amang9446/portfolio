import { Project } from "@/config/portfolio";
import ProjectCard from "@/components/projects/ProjectCard";

interface ProjectsProps {
  projects: Project[];
}

export default function Projects({ projects }: ProjectsProps) {
  return (
    <section id="projects" className="scroll-mt-20 border-t border-border">
      <div className="mx-auto max-w-5xl px-6 py-24 md:py-32">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">
          Selected work
        </p>
        <h2 className="mt-4 max-w-md text-3xl font-semibold md:text-4xl">
          Projects
        </h2>

        <div className="mt-16 flex flex-col gap-20 md:mt-20 md:gap-28">
          {projects.map((project, index) => (
            <ProjectCard key={project.id} project={project} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
