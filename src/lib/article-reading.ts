import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";

export interface ArticleHeading {
  id: string;
  label: string;
  level: 2 | 3;
  line: number;
}

export interface ArticleReadingData {
  headings: ArticleHeading[];
  readingMinutes: number;
}

const wordsPerMinute = 225;

interface MarkdownNode {
  type: string;
  value?: string;
  alt?: string | null;
  depth?: number;
  children?: MarkdownNode[];
  position?: {
    start: { line: number };
  };
}

function parseMarkdown(markdown: string) {
  return unified()
    .use(remarkParse)
    .use(remarkGfm)
    .parse(markdown) as MarkdownNode;
}

function nodeText(node: MarkdownNode): string {
  if (node.type === "image") return node.alt ?? "";
  if (node.type === "html") return "";
  if (node.type === "break") return " ";
  if (typeof node.value === "string") return node.value;
  return node.children?.map(nodeText).join("") ?? "";
}

function headingSlug(value: string) {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s-]+/g, "-");
}

function getArticleHeadings(root: MarkdownNode): ArticleHeading[] {
  const headings: ArticleHeading[] = [];
  const slugCounts = new Map<string, number>();

  const collectHeadings = (node: MarkdownNode) => {
    if (node.type === "heading" && (node.depth === 2 || node.depth === 3)) {
      const label = nodeText(node).trim();
      const line = node.position?.start.line ?? headings.length + 1;

      if (label) {
        const baseSlug = headingSlug(label) || `section-${line}`;
        const occurrence = (slugCounts.get(baseSlug) ?? 0) + 1;
        slugCounts.set(baseSlug, occurrence);

        headings.push({
          id: occurrence === 1 ? baseSlug : `${baseSlug}-${occurrence}`,
          label,
          level: node.depth,
          line,
        });
      }
    }

    node.children?.forEach(collectHeadings);
  };

  collectHeadings(root);

  return headings;
}

function getReadingMinutes(root: MarkdownNode) {
  const readableNodeText = (node: MarkdownNode): string => {
    if (node.type === "code" || node.type === "html" || node.type === "image") {
      return "";
    }
    if (typeof node.value === "string") return node.value;
    return node.children?.map(readableNodeText).join(" ") ?? "";
  };
  const readableText = readableNodeText(root);
  const wordCount = readableText.match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu)?.length ?? 0;

  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
}

export function getArticleReadingData(markdown: string): ArticleReadingData {
  const root = parseMarkdown(markdown);

  return {
    headings: getArticleHeadings(root),
    readingMinutes: getReadingMinutes(root),
  };
}
