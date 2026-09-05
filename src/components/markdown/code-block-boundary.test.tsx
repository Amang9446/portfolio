import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ComponentProps } from "react";
import MarkdownContent from "./markdown-content";
import CodeBlock from "./code-block";

const { received } = vi.hoisted(() => ({
  received: [] as Record<string, unknown>[],
}));

vi.mock("./code-block", async (importOriginal) => {
  const original = await importOriginal<typeof import("./code-block")>();
  return {
    default: (props: ComponentProps<typeof CodeBlock>) => {
      received.push(props);
      return <original.default {...props} />;
    },
  };
});

beforeEach(() => {
  received.length = 0;
});

describe("code block client boundary", () => {
  it("passes compact toolbar metadata without duplicating the highlighted syntax tree", () => {
    const code = Array.from(
      { length: 80 },
      (_, i) => `const value${i} = "example ${i}";`,
    ).join("\n");
    const html = renderToStaticMarkup(
      <MarkdownContent
        content={'```ts title="example.ts" numbered\n' + code + "\n```"}
        readingExperience
      />,
    );
    expect(html).toContain("example.ts");
    expect(html).toContain("TypeScript");
    expect(html.match(/class="code-line"/g)).toHaveLength(80);
    const { children, ...metadata } = received[0];
    void children;
    expect(Object.keys(metadata)).not.toContain("node");
    expect(Buffer.byteLength(JSON.stringify(metadata))).toBeLessThan(200);
  });
});
