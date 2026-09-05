import Link from "next/link";
import { FileText } from "lucide-react";
import { articleMarkdownPath } from "@/lib/article-markdown";

interface ArticleMarkdownButtonProps {
  slug: string;
}

export default function ArticleMarkdownButton({
  slug,
}: ArticleMarkdownButtonProps) {
  return (
    <Link
      href={articleMarkdownPath(slug)}
      type="text/markdown"
      title="Open this article as Markdown for LLMs"
      className="inline-flex min-h-11 items-center gap-1.5 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
    >
      <FileText aria-hidden="true" className="h-3.5 w-3.5" />
      For LLMs
      <span className="text-muted-foreground/70">.md</span>
    </Link>
  );
}
