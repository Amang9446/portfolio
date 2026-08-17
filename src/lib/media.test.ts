import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { postMediaPaths } from "./media";

const HOST = "abc.supabase.co";
const base = `https://${HOST}/storage/v1/object/public/media/`;

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", `https://${HOST}`);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("postMediaPaths", () => {
  it("returns the banner path", () => {
    expect(
      postMediaPaths({
        content: "",
        cover_image_url: `${base}posts/a/cover.webp`,
      }),
    ).toEqual(["posts/a/cover.webp"]);
  });

  it("collects images embedded in the body", () => {
    const content = `![one](${base}posts/1.png)\n\ntext\n\n![two](${base}posts/2.png)`;

    expect(postMediaPaths({ content, cover_image_url: "" })).toEqual([
      "posts/1.png",
      "posts/2.png",
    ]);
  });

  it("collects reference-style images via their definitions", () => {
    const content = `![diagram][fig]\n\n[fig]: ${base}posts/fig.png`;

    expect(postMediaPaths({ content, cover_image_url: "" })).toEqual([
      "posts/fig.png",
    ]);
  });

  it("handles angle-bracket destinations", () => {
    const content = `![x](<${base}posts/a%20b.png>)`;

    expect(postMediaPaths({ content, cover_image_url: "" })).toEqual([
      "posts/a b.png",
    ]);
  });

  it("handles alt text containing brackets", () => {
    const content = `![see [1] note](${base}posts/x.png)`;

    expect(postMediaPaths({ content, cover_image_url: "" })).toEqual([
      "posts/x.png",
    ]);
  });

  it("ignores a title after the URL", () => {
    const content = `![x](${base}posts/x.png "A caption")`;

    expect(postMediaPaths({ content, cover_image_url: "" })).toEqual([
      "posts/x.png",
    ]);
  });

  it("de-duplicates an image used twice", () => {
    const content = `![a](${base}x.png) and again ![a](${base}x.png)`;

    expect(
      postMediaPaths({ content, cover_image_url: `${base}x.png` }),
    ).toEqual(["x.png"]);
  });

  it("ignores images hosted anywhere else", () => {
    const content =
      "![cdn](https://res.cloudinary.com/x/y.png)\n![rel](/local/z.png)";

    expect(
      postMediaPaths({
        content,
        cover_image_url: "https://pbs.twimg.com/profile.jpg",
      }),
    ).toEqual([]);
  });

  it("ignores an identical path on a DIFFERENT Supabase project", () => {
    // The regression this guards: matching on pathname alone would delete
    // `posts/hero.png` from *our* bucket because someone else's URL matched.
    const other =
      "https://someone-else.supabase.co/storage/v1/object/public/media/posts/hero.png";

    expect(
      postMediaPaths({ content: `![x](${other})`, cover_image_url: other }),
    ).toEqual([]);
  });

  it("ignores objects from another bucket on the same project", () => {
    const other = `https://${HOST}/storage/v1/object/public/private/x.png`;

    expect(
      postMediaPaths({ content: `![x](${other})`, cover_image_url: "" }),
    ).toEqual([]);
  });

  it("decodes percent-encoded paths back to storage keys", () => {
    const content = `![x](${base}posts/my%20file.png)`;

    expect(postMediaPaths({ content, cover_image_url: "" })).toEqual([
      "posts/my file.png",
    ]);
  });

  it("does not treat an inline link as an image", () => {
    const content = `[not an image](${base}posts/doc.pdf)`;

    expect(postMediaPaths({ content, cover_image_url: "" })).toEqual([]);
  });

  it("ignores an unresolved local: placeholder", () => {
    expect(
      postMediaPaths({
        content: "![pending](local:abc-123)",
        cover_image_url: "",
      }),
    ).toEqual([]);
  });

  it("returns nothing for a post with no media", () => {
    expect(
      postMediaPaths({ content: "just text", cover_image_url: "" }),
    ).toEqual([]);
  });

  it("returns nothing when Supabase is not configured", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");

    expect(
      postMediaPaths({
        content: `![x](${base}x.png)`,
        cover_image_url: `${base}y.png`,
      }),
    ).toEqual([]);
  });

  it("is stable across repeated calls (regex lastIndex is reset)", () => {
    const post = { content: `![a](${base}1.png)`, cover_image_url: "" };

    expect(postMediaPaths(post)).toEqual(["1.png"]);
    expect(postMediaPaths(post)).toEqual(["1.png"]);
  });
});
