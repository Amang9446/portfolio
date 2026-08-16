import { getProjects } from "@/lib/projects";
import { getHomePosts } from "@/lib/posts";
import { getSiteContent } from "@/lib/settings";
import NavBar from "@/components/layout/nav-bar";
import Hero from "@/components/sections/Hero";
import Projects from "@/components/sections/Projects";
import Skills from "@/components/sections/Skills";
import Writing from "@/components/sections/Writing";
import Contact from "@/components/sections/Contact";
import Footer from "@/components/layout/Footer";
import { homeJsonLd, jsonLdScript } from "@/lib/structured-data";

export const revalidate = 60;

export default async function Home() {
  const [projects, posts, site] = await Promise.all([
    getProjects(),
    getHomePosts(),
    getSiteContent(),
  ]);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(homeJsonLd(site)) }}
      />
      <NavBar socialLinks={site.contact.socialLinks} sections={site.sections} />
      <Hero config={site.hero} />
      {site.sections.projects && <Projects projects={projects} />}
      {site.sections.blog && <Writing posts={posts} />}
      {site.sections.skills && <Skills skills={site.skills} />}
      {site.sections.contact && <Contact config={site.contact} />}
      <Footer author={site.metadata.author} />
    </main>
  );
}
