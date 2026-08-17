import Link from "next/link";
import NavBar from "@/components/layout/nav-bar";
import Footer from "@/components/layout/footer";
import { getSiteContent } from "@/lib/settings";

// This page reads site settings for the brand, nav, and footer, so it needs
// the same ISR window as every other public route. Without it the identity
// either freezes until the next deploy or hits Supabase on every 404.
export const revalidate = 60;

export const metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

export default async function NotFound() {
  const site = await getSiteContent();

  return (
    <main className="flex min-h-screen flex-col bg-background text-foreground">
      <NavBar
        brand={site.hero.name}
        socialLinks={site.contact.socialLinks}
        sections={site.sections}
      />
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-6 py-24 md:py-32">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">
          404
        </p>
        <h1 className="mt-4 text-3xl font-semibold md:text-4xl">
          This page doesn&rsquo;t exist
        </h1>
        <p className="mt-4 max-w-prose text-muted-foreground">
          The link may be out of date, or the page may have been moved. Nothing
          is broken on your end.
        </p>

        <div className="mt-10 flex items-center gap-4">
          <Link
            href="/"
            className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Back home
          </Link>
          {site.sections.blog && (
            <Link
              href="/blog"
              className="rounded-md border border-border px-5 py-2.5 text-sm transition-colors hover:bg-secondary"
            >
              Read the blog
            </Link>
          )}
        </div>

        {/* A hairline echo of the article end-mark, so the page still feels
            like part of the site rather than a browser default. */}
        <div
          aria-hidden="true"
          className="mt-16 flex items-center gap-4 text-border"
        >
          <span className="h-px w-12 bg-border" />
          <span className="h-1.5 w-1.5 rotate-45 bg-primary/70" />
          <span className="h-px flex-1 bg-border" />
        </div>
      </div>
      <Footer author={site.metadata.author} />
    </main>
  );
}
