import { portfolioConfig } from "@/config/portfolio";
import NavBar from "@/components/layout/nav-bar";
import Hero from "@/components/sections/Hero";
import Projects from "@/components/sections/Projects";
import Skills from "@/components/sections/Skills";
import Contact from "@/components/sections/Contact";
import Footer from "@/components/layout/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Navbar */}
      <NavBar />

      {/* Hero Section */}
      <Hero config={portfolioConfig.hero} />

      {/* Projects Section */}
      <Projects projects={portfolioConfig.projects} />

      {/* Skills Section */}
      <Skills skills={portfolioConfig.skills} />

      {/* Contact Section */}
      <Contact config={portfolioConfig.contact} />

      {/* Footer */}
      <Footer author={portfolioConfig.metadata.author} />
    </main>
  );
}
