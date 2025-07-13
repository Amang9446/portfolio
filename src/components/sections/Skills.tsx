import { Skill } from "@/config/portfolio";

interface SkillsProps {
  skills: Skill[];
}

export default function Skills({ skills }: SkillsProps) {
  const techSkills = skills.filter((skill) => skill.category === "tech");
  const toolSkills = skills.filter((skill) => skill.category === "tools");

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl md:text-5xl tracking-tight font-extrabold">
          S<span className="underline">kills</span>
          <span className="ml-2 text-4xl">🛠️</span>
        </h1>
      </div>

      <div className="grid gap-6">
        <div className="rounded-xl border bg-card text-card-foreground shadow">
          <div className="flex flex-col space-y-1.5 p-6">
            <div className="font-semibold tracking-tight text-lg">Tech</div>
          </div>
          <div className="p-6 pt-0">
            <div className="flex flex-wrap gap-2">
              {techSkills.map((skill) => (
                <div
                  key={skill.name}
                  className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80"
                >
                  {skill.name}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card text-card-foreground shadow">
          <div className="flex flex-col space-y-1.5 p-6">
            <div className="font-semibold tracking-tight text-lg">Tools</div>
          </div>
          <div className="p-6 pt-0">
            <div className="flex flex-wrap gap-2">
              {toolSkills.map((skill) => (
                <div
                  key={skill.name}
                  className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80"
                >
                  {skill.name}
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-muted-foreground font-semibold">
          And flexible enough to learn anything when needed
        </p>
      </div>
    </div>
  );
}
