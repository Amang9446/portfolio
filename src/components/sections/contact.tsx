"use client";
import { ContactConfig } from "@/config/portfolio";
import { getIcon } from "@/components/ui/icons";
import { toast } from "sonner";

interface ContactProps {
  config: ContactConfig;
}

export default function Contact({ config }: ContactProps) {
  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(config.email);
      toast.success("Email copied to clipboard");
    } catch (err) {
      console.error("Failed to copy email:", err);
    }
  };

  return (
    <section id="contact" className="scroll-mt-20 border-t border-border">
      <div className="mx-auto max-w-5xl px-6 py-24 md:py-32">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            {config.availability} for new work
          </span>
        </div>

        <h2 className="mt-6 max-w-xl text-[clamp(2rem,5vw,3.25rem)] font-semibold leading-[1.1]">
          Let&apos;s work together
        </h2>
        <p className="mt-5 max-w-[48ch] leading-relaxed text-muted-foreground">
          Have a project in mind? I&apos;d love to hear about it.{" "}
          {config.responseTime}.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-5">
          <a
            href={`mailto:${config.email}`}
            className="text-lg font-medium text-foreground underline decoration-border underline-offset-8 transition-colors hover:text-primary hover:decoration-primary md:text-xl"
          >
            {config.email}
          </a>
          <button
            onClick={handleCopyEmail}
            aria-label="Copy email address"
            className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          >
            {getIcon("copy", { className: "h-3.5 w-3.5" })}
            Copy
          </button>
        </div>

        <div className="mt-14 flex gap-2">
          {config.socialLinks.map((social) => (
            <a
              key={social.name}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={social.name}
              className="inline-flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              {getIcon(social.icon, { className: "h-5 w-5" })}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
