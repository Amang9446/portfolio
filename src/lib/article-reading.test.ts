import { describe, expect, it } from "vitest";
import { getArticleReadingData } from "./article-reading";

describe("getArticleReadingData — headings", () => {
  it("collects h2 and h3 with slugged ids", () => {
    const { headings } = getArticleReadingData(
      "# Title\n\n## First Section\n\n### Nested Bit\n",
    );

    expect(headings).toEqual([
      { id: "first-section", label: "First Section", level: 2, line: 3 },
      { id: "nested-bit", label: "Nested Bit", level: 3, line: 5 },
    ]);
  });

  it("ignores h1 and h4+", () => {
    const { headings } = getArticleReadingData("# One\n\n#### Four\n");
    expect(headings).toEqual([]);
  });

  it("suffixes duplicate slugs so anchors stay unique", () => {
    const { headings } = getArticleReadingData(
      "## Setup\n\n## Setup\n\n## Setup\n",
    );
    expect(headings.map((heading) => heading.id)).toEqual([
      "setup",
      "setup-2",
      "setup-3",
    ]);
  });

  it("flattens inline markup into the label", () => {
    const { headings } = getArticleReadingData(
      "## Using `useState` and **refs**\n",
    );
    expect(headings[0]).toMatchObject({
      label: "Using useState and refs",
      id: "using-usestate-and-refs",
    });
  });

  it("uses image alt text rather than dropping the heading", () => {
    const { headings } = getArticleReadingData("## ![Logo](a.png) Brand\n");
    expect(headings[0].label).toBe("Logo Brand");
  });

  it("falls back to a line-based id when nothing slugs", () => {
    const { headings } = getArticleReadingData("## ???\n");
    expect(headings[0].id).toBe("section-1");
  });

  it("does not treat a heading inside a code fence as a heading", () => {
    const { headings } = getArticleReadingData(
      "```md\n## Not A Heading\n```\n",
    );
    expect(headings).toEqual([]);
  });
});

describe("getArticleReadingData — reading time", () => {
  it("never returns less than one minute", () => {
    expect(getArticleReadingData("").readingMinutes).toBe(1);
    expect(getArticleReadingData("a few words").readingMinutes).toBe(1);
  });

  it("rounds up at roughly 225 words per minute", () => {
    expect(getArticleReadingData("word ".repeat(225)).readingMinutes).toBe(1);
    expect(getArticleReadingData("word ".repeat(226)).readingMinutes).toBe(2);
  });

  it("excludes code blocks from the word count", () => {
    const prose = "word ".repeat(200);
    const withCode = `${prose}\n\n\`\`\`ts\n${"token ".repeat(500)}\n\`\`\`\n`;

    expect(getArticleReadingData(withCode).readingMinutes).toBe(1);
  });

  it("counts hyphenated and apostrophised words once", () => {
    expect(
      getArticleReadingData("state-of-the-art doesn't").readingMinutes,
    ).toBe(1);
  });
});
