import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PostSummary } from "./posts";
import type { SiteContent } from "./settings";

const getPublishedPosts = vi.fn<() => Promise<PostSummary[]>>();
const getSiteContent = vi.fn<() => Promise<SiteContent>>();

vi.mock("./posts", () => ({ getPublishedPosts: () => getPublishedPosts() }));
vi.mock("./settings", () => ({ getSiteContent: () => getSiteContent() }));

const { buildFeedXml } = await import("./feed");

function summary(overrides: Partial<PostSummary> = {}): PostSummary {
  return {
    id: "post-id",
    slug: "hello-world",
    title: "Hello World",
    excerpt: "A summary.",
    cover_image_url: "",
    cover_image_alt: "",
    show_on_home: false,
    view_count: 0,
    like_count: 0,
    published: true,
    published_at: "2026-03-04T10:00:00.000Z",
    tags: [],
    meta: {},
    created_at: "2026-03-01T00:00:00.000Z",
    updated_at: "2026-03-04T10:00:00.000Z",
    ...overrides,
  };
}

function site(blog = true): SiteContent {
  return {
    hero: {
      name: "Author",
      title: "Engineer",
      subtitle: "",
      description: "",
      image: "",
    },
    contact: {
      email: "author@example.com",
      availability: "",
      responseTime: "",
      socialLinks: [],
    },
    metadata: {
      title: "Site Title",
      description: "Site description.",
      author: "Author",
      keywords: [],
      twitterHandle: "",
    },
    skills: [],
    sections: { projects: true, skills: true, blog, contact: true },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  getSiteContent.mockResolvedValue(site());
  getPublishedPosts.mockResolvedValue([summary()]);
});

describe("buildFeedXml", () => {
  it("emits a well-formed RSS 2.0 channel", async () => {
    const xml = await buildFeedXml();

    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(xml).toContain('<rss version="2.0"');
    expect(xml).toContain("<title>Site Title</title>");
    expect(xml).toContain('rel="self"');
    expect(xml.trimEnd().endsWith("</rss>")).toBe(true);
  });

  it("formats dates as RFC 822, which RSS requires", async () => {
    const xml = await buildFeedXml();
    expect(xml).toContain("<pubDate>Wed, 04 Mar 2026 10:00:00 GMT</pubDate>");
  });

  it("uses the row id as a stable guid, since slugs can change", async () => {
    const xml = await buildFeedXml();
    expect(xml).toContain('<guid isPermaLink="false">post-id</guid>');
  });

  it("escapes XML metacharacters without double-escaping the ampersand", async () => {
    getPublishedPosts.mockResolvedValue([
      summary({ title: 'Tom & Jerry <3 "quotes"' }),
    ]);

    const xml = await buildFeedXml();

    expect(xml).toContain(
      "<title>Tom &amp; Jerry &lt;3 &quot;quotes&quot;</title>",
    );
    expect(xml).not.toContain("&amp;amp;");
  });

  it("emits one category per tag", async () => {
    getPublishedPosts.mockResolvedValue([
      summary({ tags: ["React Native", "Rendering"] }),
    ]);

    const xml = await buildFeedXml();

    expect(xml).toContain("<category>React Native</category>");
    expect(xml).toContain("<category>Rendering</category>");
  });

  it("omits pubDate for a post with no publication date", async () => {
    getPublishedPosts.mockResolvedValue([summary({ published_at: null })]);
    expect(await buildFeedXml()).not.toContain("<pubDate>");
  });

  it("returns an empty channel rather than failing when the blog is hidden", async () => {
    getSiteContent.mockResolvedValue(site(false));

    const xml = await buildFeedXml();

    expect(xml).toContain("<channel>");
    expect(xml).not.toContain("<item>");
    expect(getPublishedPosts).not.toHaveBeenCalled();
  });
});
