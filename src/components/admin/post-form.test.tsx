/**
 * Render smoke test for the post editor.
 *
 * The admin routes are dynamic, so `next build` never renders this component —
 * a broken import or bad hook wiring would otherwise only surface in the
 * browser. This mounts the whole tree (form, toolbar, preview pane) and checks
 * the pieces the four editor modules are responsible for actually appear.
 */
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { Post } from "@/lib/posts";

// "use server" modules cannot be imported into a test environment.
vi.mock("@/app/admin/actions", () => ({
  savePost: vi.fn(),
  deletePost: vi.fn(),
  checkPostSlugAvailability: vi.fn(),
}));

const PostForm = (await import("./post-form")).default;

function post(overrides: Partial<Post> = {}): Post {
  return {
    id: "post-id",
    slug: "hello-world",
    title: "Hello World",
    excerpt: "A summary.",
    content: "## Section\n\nBody text.\n",
    cover_image_url: "",
    cover_image_alt: "",
    show_on_home: false,
    view_count: 0,
    like_count: 0,
    published: true,
    published_at: "2026-03-04T10:00:00.000Z",
    tags: ["React Native"],
    meta: {},
    created_at: "2026-03-01T00:00:00.000Z",
    updated_at: "2026-03-04T10:00:00.000Z",
    ...overrides,
  };
}

describe("PostForm", () => {
  it("renders for a new post", () => {
    const html = renderToStaticMarkup(<PostForm />);

    expect(html).toContain('name="title"');
    expect(html).toContain('name="slug"');
    expect(html).toContain('name="content"');
    // No hidden id field means savePost will insert rather than update.
    expect(html).not.toContain('name="id"');
  });

  it("renders an existing post's values", () => {
    const html = renderToStaticMarkup(<PostForm post={post()} />);

    expect(html).toContain('value="Hello World"');
    expect(html).toContain('value="hello-world"');
    expect(html).toContain('value="post-id"');
    expect(html).toContain("Body text.");
  });

  it("renders the toolbar actions and mode switcher", () => {
    const html = renderToStaticMarkup(<PostForm post={post()} />);

    for (const label of [
      "Bold (⌘B)",
      "Italic (⌘I)",
      "Heading (⌘⇧2 · toggles)",
      "Image (⌘⇧I · uploads on Save)",
      "Keyboard shortcuts",
    ]) {
      expect(html).toContain(label);
    }
    expect(html).toContain(">write<");
    expect(html).toContain(">split<");
    expect(html).toContain(">preview<");
  });

  it("shows the editor stats line", () => {
    const html = renderToStaticMarkup(<PostForm post={post()} />);

    expect(html).toContain("Ln 1, Col 1");
    expect(html).toContain("min read");
  });

  it("surfaces a server error passed in from the page", () => {
    const html = renderToStaticMarkup(
      <PostForm post={post()} error="post-save-failed" />,
    );

    expect(html).toContain("Failed to save post. Please check the logs.");
  });

  it("offers Delete only for a saved post", () => {
    expect(renderToStaticMarkup(<PostForm post={post()} />)).toContain(
      ">Delete<",
    );
    expect(renderToStaticMarkup(<PostForm />)).not.toContain(">Delete<");
  });

  it("offers exact-file agent uploads only for a saved draft", () => {
    expect(
      renderToStaticMarkup(<PostForm post={post({ published: false })} />),
    ).toContain("Agent image upload");
    expect(renderToStaticMarkup(<PostForm post={post()} />)).not.toContain(
      "Agent image upload",
    );
    expect(renderToStaticMarkup(<PostForm />)).not.toContain(
      "Agent image upload",
    );
  });
});
