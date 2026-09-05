import { describe, expect, it } from "vitest";
import { articleMarkdownPath, buildArticleMarkdown } from "./article-markdown";
import type { Post } from "./posts";

function post(overrides: Partial<Post> = {}): Post {
  return {
    id: "post-id",
    slug: "hello-world",
    title: "Hello World",
    excerpt: "A short summary.",
    content: "## Section\n\nBody text.\n",
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

describe("articleMarkdownPath", () => {
  it("appends .md to the article path", () => {
    expect(articleMarkdownPath("hello-world")).toBe("/blog/hello-world.md");
  });

  it("encodes slugs that need it", () => {
    expect(articleMarkdownPath("a b")).toBe("/blog/a%20b.md");
  });
});

describe("buildArticleMarkdown", () => {
  it("leads with the title and the excerpt as a quote", () => {
    const output = buildArticleMarkdown(post(), "Author Name");

    expect(output.startsWith("# Hello World\n\n> A short summary.\n")).toBe(
      true,
    );
  });

  it("lists source, author, and publication date", () => {
    const output = buildArticleMarkdown(post(), "Author Name");

    // Absolute, so the .md endpoint is self-contained for LLM consumers.
    expect(output).toMatch(/- Source: https?:\/\/[^/]+\/blog\/hello-world$/m);
    expect(output).toContain("- Author: Author Name");
    expect(output).toContain("- Published: 2026-03-04");
  });

  it("omits the published line for a draft", () => {
    const output = buildArticleMarkdown(post({ published_at: null }), "A");
    expect(output).not.toContain("- Published:");
  });

  it("omits the excerpt quote when there is no excerpt", () => {
    const output = buildArticleMarkdown(post({ excerpt: "" }), "A");
    expect(output).not.toContain(">");
  });

  it("flattens a multi-line excerpt onto one quote line", () => {
    const output = buildArticleMarkdown(
      post({ excerpt: "One line.\n  Another   line." }),
      "A",
    );

    expect(output).toContain("> One line. Another line.\n");
  });

  it("includes the cover image with its alt text", () => {
    const output = buildArticleMarkdown(
      post({
        cover_image_url: "https://cdn/x.webp",
        cover_image_alt: "A diagram",
      }),
      "A",
    );

    expect(output).toContain("![A diagram](https://cdn/x.webp)");
  });

  it("falls back to the title when the cover has no alt text", () => {
    const output = buildArticleMarkdown(
      post({ cover_image_url: "https://cdn/x.webp" }),
      "A",
    );

    expect(output).toContain("![Hello World](https://cdn/x.webp)");
  });

  it("normalizes CRLF line endings in the body", () => {
    const output = buildArticleMarkdown(post({ content: "a\r\nb\r\n" }), "A");

    expect(output).not.toContain("\r");
    expect(output).toContain("a\nb");
  });

  it("keeps standard GFM callout syntax intact for LLM consumers", () => {
    const output = buildArticleMarkdown(
      post({ content: "> [!NOTE]\n> Keep me.\n" }),
      "A",
    );

    expect(output).toContain("> [!NOTE]");
  });
});
