import { Project } from "@/config/portfolio";
import ProjectCard from "@/components/projects/ProjectCard";

interface ProjectsProps {
  projects: Project[];
}

export default function Projects({ projects }: ProjectsProps) {
  return (
    <section
      id="projects"
      className="relative py-20 px-2 md:px-4 bg-gradient-to-br from-background via-background to-muted/10"
    >
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      <div className="relative max-w-7xl mx-auto">
        <div className="text-center mb-16 transition-all duration-700 ease-out opacity-100 translate-y-0">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/10 mb-6">
            <div className="w-2 h-2 rounded-full bg-primary/60"></div>
            <span className="text-sm font-medium text-muted-foreground">
              Featured Work
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold mb-6 bg-gradient-to-r from-foreground via-foreground/80 to-foreground/60 bg-clip-text text-transparent tracking-tight">
            Projects I&apos;ve worked on
          </h1>
        </div>

        <div className="rounded-xl border text-card-foreground shadow p-4 md:p-6 lg:p-8 bg-card/50 backdrop-blur-sm border-border/50 transition-all duration-700 ease-out delay-200 opacity-100 translate-y-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {projects.map((project, index) => (
              <ProjectCard
                key={project.id}
                project={project}
                delay={300 + index * 100}
              />
            ))}
          </div>
        </div>

        <div className="text-center mt-16 transition-all duration-700 ease-out delay-700 opacity-100 translate-y-0">
          <div className="inline-flex items-center gap-2 text-muted-foreground">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-border"></div>
            <span className="text-sm">More projects coming soon</span>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-border"></div>
          </div>
        </div>
      </div>
    </section>
  );
}
