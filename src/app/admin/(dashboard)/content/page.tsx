import { getSiteContent } from "@/lib/settings";
import {
  saveHero,
  saveContact,
  saveMeta,
  saveSkills,
  saveSections,
} from "../../actions";

const inputClass =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-ring";
const textareaClass =
  "w-full resize-y rounded-md border border-input bg-background p-3 text-sm leading-relaxed text-foreground outline-none transition-colors focus:border-ring";
const saveButtonClass =
  "self-start rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90";

interface PageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function SiteContentPage({ searchParams }: PageProps) {
  const [{ error }, content] = await Promise.all([
    searchParams,
    getSiteContent(),
  ]);
  const { hero, contact, metadata, skills, sections } = content;

  const sectionToggles = [
    { name: "projects", label: "Projects", checked: sections.projects },
    { name: "skills", label: "Skills", checked: sections.skills },
    { name: "blog", label: "Blog", checked: sections.blog },
    { name: "contact", label: "Contact", checked: sections.contact },
  ];

  const social = (icon: string) =>
    contact.socialLinks.find((s) => s.icon === icon)?.url ?? "";
  const skillList = (category: "tech" | "tools") =>
    skills
      .filter((s) => s.category === category)
      .map((s) => s.name)
      .join(", ");

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold">Site content</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Everything on the homepage outside of projects. Changes go live within a
        minute.
      </p>

      {error && (
        <p className="mt-6 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </p>
      )}
      {/* Section visibility */}
      <section className="mt-10">
        <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-primary">
          Sections
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Untick a section to hide it from the site. Hiding Blog also removes
          the page and its nav link.
        </p>
        <form action={saveSections} className="mt-4 flex flex-col gap-4">
          <div className="flex flex-wrap gap-x-8 gap-y-3">
            {sectionToggles.map((s) => (
              <label
                key={s.name}
                className="flex cursor-pointer items-center gap-2.5 text-sm"
              >
                <input
                  name={s.name}
                  type="checkbox"
                  defaultChecked={s.checked}
                  className="h-4 w-4 accent-primary"
                />
                <span>{s.label}</span>
              </label>
            ))}
          </div>
          <button type="submit" className={saveButtonClass}>
            Save sections
          </button>
        </form>
      </section>

      {/* Hero */}
      <section className="mt-12 border-t border-border pt-10">
        <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-primary">
          Hero
        </h2>
        <form action={saveHero} className="mt-4 flex flex-col gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label
              className="flex flex-col gap-1.5 text-sm"
              title="Your name, the big heading"
            >
              <span className="text-muted-foreground">Name</span>
              <input
                name="name"
                required
                defaultValue={hero.name}
                className={inputClass}
              />
            </label>
            <label
              className="flex flex-col gap-1.5 text-sm"
              title="Role line under your name"
            >
              <span className="text-muted-foreground">Title</span>
              <input
                name="title"
                required
                defaultValue={hero.title}
                className={inputClass}
              />
            </label>
          </div>
          <label
            className="flex flex-col gap-1.5 text-sm"
            title="Small uppercase line above your name"
          >
            <span className="text-muted-foreground">Kicker</span>
            <input
              name="subtitle"
              defaultValue={hero.subtitle}
              className={inputClass}
            />
          </label>
          <label
            className="flex flex-col gap-1.5 text-sm"
            title="Intro paragraph under the heading"
          >
            <span className="text-muted-foreground">Description</span>
            <textarea
              name="description"
              rows={3}
              defaultValue={hero.description}
              className={textareaClass}
            />
          </label>
          <label
            className="flex flex-col gap-1.5 text-sm"
            title="Profile photo URL"
          >
            <span className="text-muted-foreground">Photo URL</span>
            <input
              name="image"
              type="url"
              defaultValue={hero.image}
              className={`${inputClass} font-mono`}
            />
          </label>
          <button type="submit" className={saveButtonClass}>
            Save hero
          </button>
        </form>
      </section>

      {/* Skills */}
      <section className="mt-12 border-t border-border pt-10">
        <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-primary">
          Skills
        </h2>
        <form action={saveSkills} className="mt-4 flex flex-col gap-4">
          <label
            className="flex flex-col gap-1.5 text-sm"
            title="Comma-separated, shown in this order"
          >
            <span className="text-muted-foreground">Technologies</span>
            <textarea
              name="tech"
              rows={2}
              defaultValue={skillList("tech")}
              className={textareaClass}
            />
          </label>
          <label
            className="flex flex-col gap-1.5 text-sm"
            title="Comma-separated, shown in this order"
          >
            <span className="text-muted-foreground">Tools</span>
            <textarea
              name="tools"
              rows={2}
              defaultValue={skillList("tools")}
              className={textareaClass}
            />
          </label>
          <button type="submit" className={saveButtonClass}>
            Save skills
          </button>
        </form>
      </section>

      {/* Contact */}
      <section className="mt-12 border-t border-border pt-10">
        <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-primary">
          Contact &amp; socials
        </h2>
        <form action={saveContact} className="mt-4 flex flex-col gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label
              className="flex flex-col gap-1.5 text-sm"
              title="Public contact email shown in the Contact section"
            >
              <span className="text-muted-foreground">Email</span>
              <input
                name="email"
                type="email"
                required
                defaultValue={contact.email}
                className={inputClass}
              />
            </label>
            <label
              className="flex flex-col gap-1.5 text-sm"
              title="Status word next to the pulsing dot, e.g. Available"
            >
              <span className="text-muted-foreground">Availability</span>
              <input
                name="availability"
                defaultValue={contact.availability}
                className={inputClass}
              />
            </label>
          </div>
          <label
            className="flex flex-col gap-1.5 text-sm"
            title="Small line under the heading, e.g. response time"
          >
            <span className="text-muted-foreground">Response note</span>
            <input
              name="responseTime"
              defaultValue={contact.responseTime}
              className={inputClass}
            />
          </label>
          <div className="grid gap-4 md:grid-cols-3">
            <label
              className="flex flex-col gap-1.5 text-sm"
              title="Leave empty to hide the icon"
            >
              <span className="text-muted-foreground">GitHub URL</span>
              <input
                name="github"
                type="url"
                defaultValue={social("github")}
                className={`${inputClass} font-mono`}
              />
            </label>
            <label
              className="flex flex-col gap-1.5 text-sm"
              title="Leave empty to hide the icon"
            >
              <span className="text-muted-foreground">LinkedIn URL</span>
              <input
                name="linkedin"
                type="url"
                defaultValue={social("linkedin")}
                className={`${inputClass} font-mono`}
              />
            </label>
            <label
              className="flex flex-col gap-1.5 text-sm"
              title="Leave empty to hide the icon"
            >
              <span className="text-muted-foreground">X URL</span>
              <input
                name="x"
                type="url"
                defaultValue={social("x")}
                className={`${inputClass} font-mono`}
              />
            </label>
          </div>
          <button type="submit" className={saveButtonClass}>
            Save contact
          </button>
        </form>
      </section>

      {/* SEO */}
      <section className="mt-12 border-t border-border pt-10">
        <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-primary">
          SEO &amp; metadata
        </h2>
        <form action={saveMeta} className="mt-4 flex flex-col gap-4">
          <label
            className="flex flex-col gap-1.5 text-sm"
            title="Browser tab title and search result headline"
          >
            <span className="text-muted-foreground">Site title</span>
            <input
              name="title"
              required
              defaultValue={metadata.title}
              className={inputClass}
            />
          </label>
          <label
            className="flex flex-col gap-1.5 text-sm"
            title="Search result and link preview description"
          >
            <span className="text-muted-foreground">Site description</span>
            <textarea
              name="description"
              rows={2}
              defaultValue={metadata.description}
              className={textareaClass}
            />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label
              className="flex flex-col gap-1.5 text-sm"
              title="Site owner's name. Used in page titles, the footer copyright, and structured data"
            >
              <span className="text-muted-foreground">Author</span>
              <input
                name="author"
                required
                defaultValue={metadata.author}
                className={inputClass}
              />
            </label>
            <label
              className="flex flex-col gap-1.5 text-sm"
              title="Comma-separated search keywords"
            >
              <span className="text-muted-foreground">Keywords</span>
              <input
                name="keywords"
                defaultValue={metadata.keywords.join(", ")}
                className={inputClass}
              />
            </label>
          </div>
          <label
            className="flex flex-col gap-1.5 text-sm"
            title="Credited on X/Twitter link previews. The @ is optional"
          >
            <span className="text-muted-foreground">X / Twitter handle</span>
            <input
              name="twitter_handle"
              defaultValue={metadata.twitterHandle}
              placeholder="yourhandle"
              className={`${inputClass} font-mono`}
            />
          </label>
          <button type="submit" className={saveButtonClass}>
            Save SEO
          </button>
        </form>
      </section>
    </div>
  );
}
