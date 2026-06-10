import { getProjects } from "@/lib/projects";
import { getSiteContent } from "@/lib/settings";
import NavBar from "@/components/layout/nav-bar";
import Hero from "@/components/sections/Hero";
import Projects from "@/components/sections/Projects";
import Skills from "@/components/sections/Skills";
import Contact from "@/components/sections/Contact";
import Footer from "@/components/layout/Footer";

export const revalidate = 60;

export default async function Home() {
  const [projects, site] = await Promise.all([getProjects(), getSiteContent()]);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <NavBar socialLinks={site.contact.socialLinks} />
      <Hero config={site.hero} />
      <Projects projects={projects} />
      <Skills skills={site.skills} />
      <Contact config={site.contact} />
      <Footer author={site.metadata.author} />
    </main>
  );
}
