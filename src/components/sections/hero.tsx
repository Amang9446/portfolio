import Image from "next/image";
import { HeroConfig } from "@/config/portfolio";

interface HeroProps {
  config: HeroConfig;
}

export default function Hero({ config }: HeroProps) {
  return (
    <header className="mx-auto max-w-5xl px-6 pt-20 pb-24 md:pt-32 md:pb-36">
      <div className="max-w-2xl">
        <h1 className="text-[clamp(2.5rem,7vw,4.5rem)] font-semibold leading-[1.05]">
          <span className="flex items-center gap-4 md:gap-5">
            <Image
              alt={`Portrait of ${config.name}`}
              width={144}
              height={144}
              preload
              sizes="(min-width: 1029px) 69px, (min-width: 572px) 6.65vw, 38px"
              className="h-[0.95em] w-[0.95em] shrink-0 rounded-full border border-border object-cover"
              src={config.image}
            />
            <span>
              {config.name}
              <span className="text-primary">.</span>
            </span>
          </span>
          <span className="mt-2 block text-[clamp(1.4rem,3.5vw,2.25rem)] font-normal text-muted-foreground">
            {config.title}
          </span>
        </h1>

        <p className="mt-8 max-w-[52ch] text-base leading-relaxed text-muted-foreground">
          {config.description}
        </p>

        <div className="mt-10 flex items-center gap-6">
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
    </header>
  );
}
