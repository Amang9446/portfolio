import Image from "next/image";
import { HeroConfig } from "@/config/portfolio";

interface HeroProps {
  config: HeroConfig;
}

export default function Hero({ config }: HeroProps) {
  return (
    <header className="mx-auto max-w-5xl px-6 pt-20 pb-24 md:pt-32 md:pb-36">
      <div className="flex flex-col-reverse items-start gap-12 md:flex-row md:items-end md:justify-between md:gap-16">
        <div className="max-w-xl">
          <p
            className="reveal font-mono text-xs uppercase tracking-[0.2em] text-primary"
            style={{ "--reveal-delay": "0ms" } as React.CSSProperties}
          >
            {config.subtitle}
          </p>

          <h1
            className="reveal mt-6 text-[clamp(2.5rem,7vw,4.5rem)] font-semibold leading-[1.05]"
            style={{ "--reveal-delay": "100ms" } as React.CSSProperties}
          >
            {config.name}
            <span className="text-primary">.</span>
            <span className="mt-2 block text-[clamp(1.4rem,3.5vw,2.25rem)] font-normal text-muted-foreground">
              {config.title}
            </span>
          </h1>

          <p
            className="reveal mt-8 max-w-[52ch] text-base leading-relaxed text-muted-foreground"
            style={{ "--reveal-delay": "220ms" } as React.CSSProperties}
          >
            {config.description}
          </p>

          <div
            className="reveal mt-10 flex items-center gap-6"
            style={{ "--reveal-delay": "340ms" } as React.CSSProperties}
          >
            <a
              href="#projects"
              className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              See my work
            </a>
            <a
              href="#contact"
              className="text-sm text-muted-foreground underline decoration-border underline-offset-4 transition-colors hover:text-foreground hover:decoration-foreground"
            >
              Get in touch
            </a>
          </div>
        </div>

        <div
          className="reveal shrink-0"
          style={{ "--reveal-delay": "180ms" } as React.CSSProperties}
        >
          <Image
            alt={`Portrait of ${config.name}`}
            width={300}
            height={300}
            priority
            className="h-36 w-36 rounded-2xl border border-border object-cover md:h-52 md:w-52"
            src={config.image}
          />
        </div>
      </div>
    </header>
  );
}
