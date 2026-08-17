/**
 * GitHub-style alerts for the article pipeline.
 *
 *   > [!NOTE]
 *   > Body text.
 *
 *   > [!WARNING] Custom title
 *   > Body text.
 *
 * `remark-gfm` does not implement these, so this plugin tags matching
 * blockquotes with `data-callout` and strips the marker. Blockquotes without a
 * marker are left exactly as they were, and the raw Markdown served at
 * `/blog/<slug>.md` keeps the standard syntax LLM consumers expect.
 *
 * The tree walk is hand-rolled to match `src/lib/article-reading.ts` rather
 * than pulling in `unist-util-visit` as a direct dependency.
 */

export const CALLOUT_KINDS = [
  "note",
  "tip",
  "important",
  "warning",
  "caution",
] as const;

export type CalloutKind = (typeof CALLOUT_KINDS)[number];

const markerPattern = new RegExp(
  `^\\[!(${CALLOUT_KINDS.join("|")})\\][ \\t]*(.*)$`,
  "i",
);

interface Node {
  type: string;
  value?: string;
  children?: Node[];
  data?: { hProperties?: Record<string, string> };
}

/**
 * Remove the marker line from the blockquote's opening paragraph, keeping
 * everything that followed it. `remaining` is the text after the marker line
 * with its leading newline already trimmed.
 */
function stripMarker(node: Node, paragraph: Node, remaining: string) {
  const [first, ...siblings] = paragraph.children ?? [];

  if (remaining) {
    first.value = remaining;
    return;
  }

  // The marker was alone on its line: drop the text node, plus a hard break
  // if one separated it from the body.
  paragraph.children =
    siblings[0]?.type === "break" ? siblings.slice(1) : siblings;

  // `> [!NOTE]` followed by a blank line leaves the paragraph empty, which
  // would render as a stray <p>.
  if (paragraph.children.length === 0) {
    node.children = node.children?.slice(1);
  }
}

function applyCallout(node: Node) {
  const paragraph = node.children?.[0];
  if (paragraph?.type !== "paragraph") return;

  const first = paragraph.children?.[0];
  if (first?.type !== "text" || typeof first.value !== "string") return;

  // Only the first line can carry the marker. Soft line breaks live inside the
  // text node's value, so the body usually trails the marker in the same node.
  const [firstLine] = first.value.split(/\r?\n/, 1);
  const match = firstLine.match(markerPattern);
  if (!match) return;

  const kind = match[1].toLowerCase();
  const title = match[2].trim();
  const remaining = first.value.slice(firstLine.length).replace(/^\r?\n/, "");

  stripMarker(node, paragraph, remaining);

  node.data = {
    ...node.data,
    hProperties: {
      ...node.data?.hProperties,
      className: "callout",
      "data-callout": kind,
      ...(title ? { "data-callout-title": title } : {}),
    },
  };
}

export default function remarkCallouts() {
  return (tree: Node) => {
    const walk = (node: Node) => {
      if (node.type === "blockquote") applyCallout(node);
      node.children?.forEach(walk);
    };

    walk(tree);
  };
}
