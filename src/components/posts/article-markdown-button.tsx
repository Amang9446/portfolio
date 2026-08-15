import Link from "next/link";
import { FileText } from "lucide-react";

interface ArticleMarkdownButtonProps {
  href: string;
}

export default function ArticleMarkdownButton({
  href,
}: ArticleMarkdownButtonProps) {
  return (
    <Link
      href={href}
      type="text/markdown"
      title="Open this page as Markdown for LLMs"
      className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
    >
      <FileText aria-hidden="true" className="h-3.5 w-3.5" />
      For LLMs
      <span className="text-muted-foreground/70">.md</span>
    </Link>
  );
}
