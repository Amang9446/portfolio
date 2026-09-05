/**
 * Splits highlighted code into per-line elements so the article can show line
 * numbers and highlight specific lines.
 *
 * Runs *after* `rehype-highlight`. A single hljs token span can straddle a
 * newline (block comments, template literals), so the split has to recurse and
 * re-open the enclosing spans on each new line rather than only splitting
 * top-level text nodes.
 *
 * Fence meta drives it — mdast-util-to-hast preserves the meta string on the
 * `<code>` element as `data.meta`:
 *
 *   ```ts title="src/lib/posts.ts" {2,4-6} numbered
 */

export interface CodeMeta {
  title?: string;
  numbered: boolean;
  highlights: Set<number>;
}

interface HastNode {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
  data?: { meta?: string };
}

/** `{2,4-6}` — individual lines and inclusive ranges, 1-based. */
function parseHighlights(meta: string) {
  const lines = new Set<number>();
  const group = meta.match(/\{([\d,\s-]+)\}/);
  if (!group) return lines;

  for (const part of group[1].split(",")) {
    const range = part.trim().match(/^(\d+)(?:-(\d+))?$/);
    if (!range) continue;

    const start = Number(range[1]);
    const end = range[2] ? Number(range[2]) : start;
    for (let line = start; line <= end; line += 1) lines.add(line);
  }

  return lines;
}

export function parseCodeMeta(meta: string | undefined): CodeMeta {
  if (!meta) return { numbered: false, highlights: new Set() };

  const title = meta.match(/(?:title|file)="([^"]*)"/)?.[1]?.trim();
  const highlights = parseHighlights(meta);

  return {
    title: title || undefined,
    // Numbers are opt-in, but a highlight is meaningless without them.
    numbered: /(?:^|\s)numbered(?:\s|$)/.test(meta) || highlights.size > 0,
    highlights,
  };
}

/**
 * Flatten `nodes` into one array of children per source line, cloning any
 * element that spans a line boundary so each line stays independently valid.
 */
function splitLines(nodes: HastNode[]): HastNode[][] {
  const lines: HastNode[][] = [[]];
  const current = () => lines[lines.length - 1];

  for (const node of nodes) {
    if (node.type === "text") {
      const parts = (node.value ?? "").split("\n");
      parts.forEach((part, index) => {
        if (index > 0) lines.push([]);
        if (part) current().push({ type: "text", value: part });
      });
      continue;
    }

    if (node.type === "element") {
      splitLines(node.children ?? []).forEach((children, index) => {
        if (index > 0) lines.push([]);
        if (children.length > 0) current().push({ ...node, children });
      });
      continue;
    }

    current().push(node);
  }

  return lines;
}

function lineElement(children: HastNode[], highlighted: boolean): HastNode {
  return {
    type: "element",
    tagName: "span",
    properties: {
      className: ["code-line"],
      ...(highlighted ? { "data-highlighted": "true" } : {}),
    },
    children,
  };
}

function transformCode(code: HastNode) {
  const meta = parseCodeMeta(code.data?.meta);
  if (!meta.numbered && meta.highlights.size === 0) return;

  const lines = splitLines(code.children ?? []);

  // mdast-util-to-hast appends a trailing newline to every code value, which
  // leaves one empty line at the end.
  if (lines.length > 1 && lines[lines.length - 1].length === 0) lines.pop();

  code.children = lines.map((children, index) =>
    lineElement(children, meta.highlights.has(index + 1)),
  );

  const className = code.properties?.className;
  code.properties = {
    ...code.properties,
    className: [
      ...(Array.isArray(className) ? className : []),
      "code-numbered",
    ],
  };
}

export default function rehypeCodeLines() {
  return (tree: HastNode) => {
    const walk = (node: HastNode) => {
      if (node.tagName === "pre") {
        const code = node.children?.find((child) => child.tagName === "code");
        if (code) transformCode(code);
        return;
      }

      node.children?.forEach(walk);
    };

    walk(tree);
  };
}
