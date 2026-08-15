import type { ComponentPropsWithoutRef } from "react";
import ReactMarkdown, {
  type Components,
  type ExtraProps,
  type UrlTransform,
} from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import {
  getArticleReadingData,
  type ArticleHeading,
} from "@/lib/article-reading";
import CodeBlock from "./code-block";

interface MarkdownContentProps {
  content: string;
  urlTransform?: UrlTransform;
  readingExperience?: boolean;
  articleHeadings?: ArticleHeading[];
}

const detectedLanguages = [
  "bash",
  "css",
  "javascript",
  "json",
  "markdown",
  "sql",
  "typescript",
  "xml",
];

const LazyArticleImage: NonNullable<Components["img"]> = ({
  node,
  alt,
  ...props
}) => {
  // `node` belongs to react-markdown and must not reach the native element.
  void node;

  return (
    // Article images are below the cover, so they should not compete with the
    // page's largest-contentful-paint image during the initial load.
    // eslint-disable-next-line @next/next/no-img-element
    <img {...props} alt={alt ?? ""} loading="lazy" decoding="async" />
  );
};

const LANGUAGE_LABELS: Record<string, string> = {
  bash: "Shell",
  css: "CSS",
  html: "HTML",
  javascript: "JavaScript",
  js: "JavaScript",
  json: "JSON",
  jsx: "JSX",
  markdown: "Markdown",
  md: "Markdown",
  sql: "SQL",
  ts: "TypeScript",
  tsx: "TSX",
  typescript: "TypeScript",
  xml: "XML",
};

function languageFromClassName(value: unknown) {
  const list = Array.isArray(value) ? value : value ? [String(value)] : [];
  for (const item of list) {
    const match = String(item).match(/language-([\w-]+)/);
    if (match?.[1]) return match[1];
  }
  return "";
}

function languageFromPreNode(node: ExtraProps["node"]) {
  if (!node || node.type !== "element") return "";

  const fromPre = languageFromClassName(node.properties?.className);
  if (fromPre) return fromPre;

  for (const child of node.children) {
    if (child.type !== "element") continue;
    const fromChild = languageFromClassName(child.properties?.className);
    if (fromChild) return fromChild;
  }

  return "";
}

function formatCodeLanguage(language: string) {
  const key = language.toLowerCase();
  if (!key || key === "text" || key === "txt" || key === "plaintext") {
    return "Code";
  }
  return LANGUAGE_LABELS[key] ?? language.toUpperCase();
}

function ArticlePre({
  node,
  children,
  className,
}: ComponentPropsWithoutRef<"pre"> & ExtraProps) {
  // Derive the label here (same render as react-markdown) and pass a string
  // into the client CodeBlock. Inspecting `children` inside CodeBlock disagrees
  // across the RSC boundary: server sees no element → "Code", client reads
  // `language-text` → "TEXT".
  return (
    <CodeBlock
      language={formatCodeLanguage(languageFromPreNode(node))}
      className={className}
    >
      {children}
    </CodeBlock>
  );
}

function createHeadingComponent(
  tag: "h2" | "h3",
  headingIds: Map<number, string>,
): NonNullable<Components["h2"]> {
  const Heading = tag;

  return function ArticleHeading({ node, children, ...props }) {
    const id = headingIds.get(node?.position?.start.line ?? -1);

    return (
      <Heading {...props} id={id}>
        {children}
        {id && (
          <a
            aria-label="Link to this section"
            className="heading-anchor"
            href={`#${id}`}
          >
            <span aria-hidden="true">#</span>
          </a>
        )}
      </Heading>
    );
  };
}

/** Shared Markdown pipeline for the editor preview and public article. */
export default function MarkdownContent({
  content,
  urlTransform,
  readingExperience = false,
  articleHeadings,
}: MarkdownContentProps) {
  const headings =
    articleHeadings ??
    (readingExperience ? getArticleReadingData(content).headings : []);
  const headingIds = new Map(
    headings.map((heading) => [heading.line, heading.id]),
  );
  const components: Components | undefined = readingExperience
    ? {
        h2: createHeadingComponent("h2", headingIds),
        h3: createHeadingComponent("h3", headingIds),
        img: LazyArticleImage,
        pre: ArticlePre,
        script: () => null,
      }
    : {
        script: () => null,
      };

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[
        [
          rehypeHighlight,
          {
            detect: true,
            subset: detectedLanguages,
            plainText: ["text", "txt"],
          },
        ],
      ]}
      urlTransform={urlTransform}
      disallowedElements={["script", "style"]}
      unwrapDisallowed
      components={components}
    >
      {content}
    </ReactMarkdown>
  );
}
