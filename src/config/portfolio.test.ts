import { describe, expect, it, vi } from "vitest";
import {
  defaultConfig,
  mergePortfolioConfig,
  parsePortfolioOverrides,
  type PortfolioConfig,
} from "./portfolio";

const base: PortfolioConfig = {
  hero: {
    name: "Your Name",
    title: "Software Engineer",
    subtitle: "Sub",
    description: "Desc",
    image: "",
  },
  projects: [
    {
      id: "a",
      title: "A",
      description: "",
      image: "",
      tags: [],
    },
  ],
  skills: [{ name: "TypeScript", category: "tech" }],
  contact: {
    email: "you@example.com",
    availability: "Available",
    responseTime: "24h",
    socialLinks: [
      { name: "GitHub", url: "https://github.com/you", icon: "github" },
    ],
  },
  metadata: {
    title: "Your Name",
    description: "",
    author: "Your Name",
    keywords: ["a"],
    twitterHandle: "",
  },
};

describe("mergePortfolioConfig", () => {
  it("returns the base untouched when there is no override", () => {
    expect(mergePortfolioConfig(base, null)).toEqual(base);
    expect(mergePortfolioConfig(base, undefined)).toEqual(base);
  });

  it("merges objects field by field", () => {
    const merged = mergePortfolioConfig(base, {
      hero: { name: "Ada Lovelace" },
    });

    expect(merged.hero.name).toBe("Ada Lovelace");
    // Untouched fields survive.
    expect(merged.hero.title).toBe("Software Engineer");
    expect(merged.hero.subtitle).toBe("Sub");
  });

  it("replaces arrays wholesale rather than merging element-wise", () => {
    const merged = mergePortfolioConfig(base, {
      skills: [{ name: "Python", category: "tech" }],
    });

    expect(merged.skills).toEqual([{ name: "Python", category: "tech" }]);
  });

  it("can shorten a list to a single entry", () => {
    const merged = mergePortfolioConfig(base, { projects: [] });
    expect(merged.projects).toEqual([]);
  });

  it("does not mutate the base config", () => {
    const snapshot = structuredClone(base);
    mergePortfolioConfig(base, {
      hero: { name: "Ada Lovelace" },
      projects: [],
    });
    expect(base).toEqual(snapshot);
  });

  it("overrides every top-level section at once", () => {
    const merged = mergePortfolioConfig(base, {
      hero: { name: "Ada Lovelace" },
      contact: { email: "ada@example.com" },
      metadata: { author: "Ada Lovelace", twitterHandle: "ada" },
    });

    expect(merged.hero.name).toBe("Ada Lovelace");
    expect(merged.contact.email).toBe("ada@example.com");
    expect(merged.contact.availability).toBe("Available");
    expect(merged.metadata.author).toBe("Ada Lovelace");
    expect(merged.metadata.twitterHandle).toBe("ada");
    expect(merged.metadata.keywords).toEqual(["a"]);
  });
});

describe("parsePortfolioOverrides", () => {
  it("is null when unset or blank", () => {
    expect(parsePortfolioOverrides(undefined)).toBeNull();
    expect(parsePortfolioOverrides("")).toBeNull();
    expect(parsePortfolioOverrides("   ")).toBeNull();
  });

  it("parses a JSON object", () => {
    expect(parsePortfolioOverrides('{"hero":{"name":"Ada Lovelace"}}')).toEqual(
      {
        hero: { name: "Ada Lovelace" },
      },
    );
  });

  it("falls back to null on malformed JSON instead of throwing", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    expect(parsePortfolioOverrides("{not json")).toBeNull();
    expect(warn).toHaveBeenCalled();

    warn.mockRestore();
  });

  it("rejects a JSON array or scalar", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    expect(parsePortfolioOverrides("[1,2]")).toBeNull();
    expect(parsePortfolioOverrides('"a string"')).toBeNull();
    expect(parsePortfolioOverrides("null")).toBeNull();

    warn.mockRestore();
  });
});

describe("defaultConfig", () => {
  it("is generic in the repo, so a fork starts from placeholders", () => {
    // Guards against personal content being committed into the defaults.
    // Asserts on defaultConfig, not portfolioConfig — the latter has the
    // environment override merged in and would pass or fail by accident.
    expect(defaultConfig.hero.name).toBe("Your Name");
    expect(defaultConfig.contact.email).toBe("you@example.com");
    expect(defaultConfig.metadata.author).toBe("Your Name");
    expect(defaultConfig.metadata.twitterHandle).toBe("");

    const serialised = JSON.stringify(defaultConfig);
    for (const owner of ["amang9446", "amanunreal", "is-a.dev"]) {
      expect(serialised).not.toContain(owner);
    }
  });
});

describe("validation of structurally wrong input", () => {
  it("drops an object field given as a scalar", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    expect(parsePortfolioOverrides('{"hero":"Ada"}')).toEqual({});

    warn.mockRestore();
  });

  it("drops keywords given as a string, which would crash .join()", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const parsed = parsePortfolioOverrides(
      '{"metadata":{"author":"Ada","keywords":"a,b"}}',
    );

    expect(parsed).toEqual({ metadata: { author: "Ada" } });
    // The valid sibling field survives.
    expect(mergePortfolioConfig(base, parsed).metadata.keywords).toEqual(["a"]);

    warn.mockRestore();
  });

  it("drops socialLinks given as an object, which would crash .map()", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    expect(
      parsePortfolioOverrides('{"contact":{"socialLinks":{},"email":"a@b.c"}}'),
    ).toEqual({ contact: { email: "a@b.c" } });

    warn.mockRestore();
  });

  it("drops projects or skills given as a non-array", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    expect(parsePortfolioOverrides('{"projects":{},"skills":"none"}')).toEqual(
      {},
    );

    warn.mockRestore();
  });

  it("ignores unknown top-level keys", () => {
    expect(parsePortfolioOverrides('{"nope":1,"hero":{"name":"Ada"}}')).toEqual(
      {
        hero: { name: "Ada" },
      },
    );
  });
});
