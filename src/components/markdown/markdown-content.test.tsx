/**
 * End-to-end tests for the article markdown pipeline.
 *
 * This is the pipeline the public article and the admin split preview share,
 * so anything asserted here holds for both. It also pins the invariant
 * `code-block.tsx` depends on: `rehype-code-lines` drops the newline text
 * nodes, which is why the copy button rejoins `.code-line` elements by hand.
 */
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import MarkdownContent from "./markdown-content";

function render(markdown: string) {
  return renderToStaticMarkup(
    <MarkdownContent content={markdown} readingExperience />,
  );
}

describe("callouts", () => {
  it("tags a marked blockquote and strips the marker", () => {
    const html = render("> [!NOTE]\n> Body text.\n");

    expect(html).toContain('data-callout="note"');
    expect(html).toContain("Body text.");
    expect(html).not.toContain("[!NOTE]");
  });

  it("supports CRLF line endings", () => {
    const html = render("> [!IMPORTANT]\r\n> Body text.\r\n");

    expect(html).toContain('data-callout="important"');
    expect(html).toContain("Body text.");
    expect(html).not.toContain("[!IMPORTANT]");
  });

  it("renders a custom title as the callout label", () => {
    const html = render("> [!WARNING] Mind the cache\n> Body.\n");

    expect(html).toContain('data-callout="warning"');
    // The title replaces the visible label; the kind stays for screen readers.
    expect(html).toContain("<span>Mind the cache</span>");
    expect(html).toContain('class="sr-only">Warning: </span>');
    // …and it must not leak into the body copy.
    expect(html).toContain("<p>Body.</p>");
  });

  it("falls back to the kind as the label when no title is given", () => {
    const html = render("> [!WARNING]\n> Body.\n");

    expect(html).toContain("Warning");
    expect(html).not.toContain("sr-only");
  });

  it("is case-insensitive on the marker", () => {
    expect(render("> [!tip]\n> Body.\n")).toContain('data-callout="tip"');
  });

  it("leaves an unmarked blockquote untouched", () => {
    const html = render("> Just a quote.\n");

    expect(html).not.toContain("data-callout");
    expect(html).toContain("Just a quote.");
  });

  it("ignores an unknown marker", () => {
    const html = render("> [!SPOILER]\n> Body.\n");

    expect(html).not.toContain("data-callout");
    expect(html).toContain("[!SPOILER]");
  });

  it("does not leave an empty paragraph when the marker stands alone", () => {
    const html = render("> [!NOTE]\n>\n> Body.\n");
    expect(html).not.toContain("<p></p>");
  });
});

describe("code fences", () => {
  it("leaves a plain fence unsplit", () => {
    const html = render("```ts\nconst a = 1;\n```\n");

    expect(html).not.toContain("code-line");
    expect(html).not.toContain("code-numbered");
  });

  it("splits into one element per line when `numbered` is set", () => {
    const html = render("```ts numbered\nconst a = 1;\nconst b = 2;\n```\n");

    expect(html).toContain("code-numbered");
    expect(html.match(/class="code-line"/g)).toHaveLength(2);
  });

  it("marks the requested lines and ranges", () => {
    const html = render(
      "```ts {2,4-5}\nlet a;\nlet b;\nlet c;\nlet d;\nlet e;\n```\n",
    );

    const lines = html.split('<span class="code-line').slice(1);
    expect(lines).toHaveLength(5);
    expect(lines.map((line) => line.startsWith('" data-highlighted'))).toEqual([
      false,
      true,
      false,
      true,
      true,
    ]);
  });

  it("turns on numbering implicitly when lines are highlighted", () => {
    expect(render("```ts {1}\nlet a;\n```\n")).toContain("code-numbered");
  });

  it("drops the trailing empty line the mdast-to-hast newline creates", () => {
    const html = render("```ts numbered\na\nb\nc\n```\n");
    expect(html.match(/class="code-line"/g)).toHaveLength(3);
  });

  it("removes newline text nodes, so lines must be rejoined to copy", () => {
    // The contract code-block.tsx relies on: no "\n" survives between lines.
    const html = render("```ts numbered\nfirst\nsecond\n```\n");
    const body = html.slice(html.indexOf("code-numbered"));

    expect(body).not.toContain("\n");
    expect(body).toContain("first");
    expect(body).toContain("second");
  });

  it("keeps the fence title available to the toolbar", () => {
    const html = render('```ts title="src/lib/posts.ts"\nlet a;\n```\n');
    expect(html).toContain("src/lib/posts.ts");
  });
});

describe("article elements", () => {
  it("gives headings ids and an anchor link", () => {
    const html = render("## First Section\n\ntext\n");

    expect(html).toContain('id="first-section"');
    expect(html).toContain('href="#first-section"');
  });

  it("lazy-loads images and defaults alt to empty rather than omitting it", () => {
    const html = render("![](photo.png)\n");

    expect(html).toContain('loading="lazy"');
    expect(html).toContain('alt=""');
    expect(html).toContain('class="article-image"');
  });

  it("renders a markdown title as a visible caption", () => {
    const html = render('![Alt](photo.png "A caption")\n');

    expect(html).toContain("article-figure-caption");
    expect(html).toContain("A caption");
  });

  it("opens external links in a new tab, but not internal ones", () => {
    const external = render("[out](https://example.com)\n");
    const internal = render("[in](/blog/post)\n");

    expect(external).toContain('target="_blank"');
    expect(external).toContain('rel="noreferrer"');
    expect(internal).not.toContain('target="_blank"');
  });

  it("wraps tables in a keyboard-pannable scroll region", () => {
    const html = render("| a | b |\n| --- | --- |\n| 1 | 2 |\n");

    expect(html).toContain("table-scroll");
    expect(html).toContain('role="region"');
    expect(html).toContain('tabindex="0"');
  });
});
