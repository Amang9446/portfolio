interface FooterProps {
  author: string;
}

export default function Footer({ author }: FooterProps) {
  return (
    <footer className="no-print border-t border-border">
      <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-2 px-6 py-8 text-sm text-muted-foreground md:flex-row md:items-center">
        <span>
          &copy; {new Date().getFullYear()} {author}
        </span>
        <span className="font-mono text-xs">
          Built with Next.js &amp; Tailwind
        </span>
      </div>
    </footer>
  );
}
