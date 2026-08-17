import { Skill } from "@/config/portfolio";

interface SkillsProps {
  skills: Skill[];
}

export default function Skills({ skills }: SkillsProps) {
  const groups = [
    { label: "Technologies", items: skills.filter((s) => s.category === "tech") },
    { label: "Tools", items: skills.filter((s) => s.category === "tools") },
  ];

  return (
    <section id="skills" className="scroll-mt-20 border-t border-border">
      <div className="mx-auto max-w-5xl px-6 py-24 md:py-32">
        <div className="flex flex-col gap-12 md:flex-row md:gap-24">
          <div className="md:w-1/3">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">
              Toolkit
            </p>
            <h2 className="mt-4 text-3xl font-semibold md:text-4xl">Skills</h2>
            <p className="mt-5 max-w-[36ch] leading-relaxed text-muted-foreground">
              The stack I reach for daily — and I pick up whatever a project
              needs.
            </p>
          </div>

          <div className="flex flex-col gap-10 md:w-2/3">
            {groups.map((group) => (
              <div key={group.label}>
                <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  {group.label}
                </h3>
                <ul className="mt-4 flex flex-wrap gap-x-2.5 gap-y-2.5">
                  {group.items.map((skill) => (
                    <li
                      key={skill.name}
                      className="rounded-md border border-border px-3 py-1.5 text-sm text-secondary-foreground transition-colors hover:border-primary/40"
                    >
                      {skill.name}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
