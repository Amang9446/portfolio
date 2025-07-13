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
    <div className="w-full max-w-4xl mx-auto">
      <div className="rounded-xl text-card-foreground relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:20px_20px]"></div>
        <div className="relative p-8 space-y-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-muted-foreground">
              {config.availability}
            </span>
          </div>

          <div className="space-y-3">
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-muted-foreground">
              Let&apos;s work together
            </h2>
            <p className="text-muted-foreground leading-relaxed hidden">
              Have a project in mind? I&apos;d love to hear about it and discuss
              how we can bring your ideas to life.
            </p>
          </div>

          <div className="space-y-4">
            <div className="group relative">
              <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg border border-border/50 group-hover:border-primary/20 transition-colors">
                {getIcon("mail", {
                  className: "h-4 w-4 text-muted-foreground",
                })}
                <span className="font-mono text-sm flex-1">{config.email}</span>
                <button
                  onClick={handleCopyEmail}
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground rounded-md text-xs h-8 w-8 p-0 transition-opacity"
                >
                  {getIcon("copy", { className: "h-3 w-3" })}
                </button>
              </div>
            </div>
          </div>

          <div className="text-center pt-2 border-t border-border/50">
            <p className="text-xs text-muted-foreground">
              {config.responseTime}
            </p>
          </div>

          {/* Social Links */}
          <div className="flex justify-center gap-6 pt-4">
            {config.socialLinks.map((social) => (
              <a
                key={social.name}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors duration-200"
                aria-label={social.name}
              >
                {getIcon(social.icon, { className: "h-6 w-6" })}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
