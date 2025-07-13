interface FooterProps {
  author: string;
}

export default function Footer({ author }: FooterProps) {
  return (
    <footer className="py-8 text-center text-muted-foreground bg-background border-t border-border">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row justify-center items-center gap-4">
          <span>
            &copy; {new Date().getFullYear()} {author} | Portfolio by {author}
          </span>
        </div>
      </div>
    </footer>
  );
}
