import { describe, expect, it } from "vitest";
import { pageTitle, twitterCreator, type SiteContent } from "./settings";

function site(metadata: Partial<SiteContent["metadata"]>): SiteContent {
  return {
    hero: {
      name: "Ada",
      title: "Engineer",
      subtitle: "",
      description: "",
      image: "",
    },
    contact: {
      email: "ada@example.com",
      availability: "",
      responseTime: "",
      socialLinks: [],
    },
    metadata: {
      title: "Site",
      description: "",
      author: "Ada Lovelace",
      keywords: [],
      twitterHandle: "",
      ...metadata,
    },
    skills: [],
    sections: { projects: true, skills: true, blog: true, contact: true },
  };
}

describe("pageTitle", () => {
  it("suffixes the label with the author", () => {
    expect(pageTitle("Blog", site({}))).toBe("Blog | Ada Lovelace");
  });

  it("returns the bare label when no author is set", () => {
    expect(pageTitle("Blog", site({ author: "" }))).toBe("Blog");
    expect(pageTitle("Blog", site({ author: "   " }))).toBe("Blog");
  });
});

describe("twitterCreator", () => {
  it("adds the leading @ the meta tag requires", () => {
    expect(twitterCreator(site({ twitterHandle: "adalovelace" }))).toBe(
      "@adalovelace",
    );
  });

  it("does not double up when the author already typed one", () => {
    expect(twitterCreator(site({ twitterHandle: "@adalovelace" }))).toBe(
      "@adalovelace",
    );
  });

  it("is undefined when unset, so the tag is omitted entirely", () => {
    expect(twitterCreator(site({ twitterHandle: "" }))).toBeUndefined();
    expect(twitterCreator(site({ twitterHandle: "  " }))).toBeUndefined();
  });
});
