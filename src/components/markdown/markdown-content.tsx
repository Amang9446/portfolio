import ReactMarkdown, {
  type Components,
  type UrlTransform,
} from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import {
  getArticleReadingData,
  type ArticleHeading,
} from "@/lib/article-reading";
import rehypeCodeLines, { parseCodeMeta } from "@/lib/rehype-code-lines";
import remarkCallouts from "@/lib/remark-callouts";
import { siteUrl } from "@/lib/site-url";
import Callout from "./callout";
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

// `node` belongs to react-markdown and must not reach the native element.

const LazyArticleImage: NonNullable<Components["img"]> = ({
  node,
  alt,
  title,
  className,
  ...props
}) => {
  void node;

  // Article images are below the cover, so they should not compete with the
  // page's largest-contentful-paint image during the initial load.
  //
  // Zooming is layered on at runtime by article-lightbox.tsx, which promotes
  // these to focusable buttons. Deliberately not marked up as a <button> here:
  // a linked image would then nest a button inside an <a>, and the affordance
  // would be advertised even where the JS that implements it never loads.
  const image = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      {...props}
      alt={alt ?? ""}
      className={["article-image", className].filter(Boolean).join(" ")}
      loading="lazy"
      decoding="async"
    />
  );

  // A markdown title (`![alt](src "caption")`) becomes a visible caption.
  // Spans, not <figure>: the image lives inside a <p>, where figure is
  // invalid and would break hydration.
  if (!title) return image;

  return (
    <span className="article-figure">
      {image}
      <span className="article-figure-caption">{title}</span>
    </span>
  );
};

const ArticleLink: NonNullable<Components["a"]> = ({
  node,
  href,
  children,
  ...props
}) => {
  void node;

  const external =
    typeof href === "string" &&
    /^https?:\/\//.test(href) &&
    !href.startsWith(siteUrl.origin);

  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
      {...props}
    >
      {children}
    </a>
  );
};

const ArticleTable: NonNullable<Components["table"]> = ({
  node,
  children,
  ...props
}) => {
  void node;

  // Scrollable region: tabbable so keyboard readers can pan wide tables.
  return (
    <div className="table-scroll" role="region" aria-label="Table" tabIndex={0}>
      <table {...props}>{children}</table>
    </div>
  );
};

// Read the declared language and fence meta from the hast `pre` node's <code>
// child rather than from the rendered `children`. react-markdown's hast is
// identical on server and client, whereas `children` can be a fragment/string
// during hydration, which made the label flip (hydration mismatch).
function codeInfo(node: unknown) {
  const empty = {
    language: undefined as string | undefined,
    meta: undefined as string | undefined,
  };
  if (!node || typeof node !== "object") return empty;
  const children = (node as { children?: unknown }).children;
  if (!Array.isArray(children)) return empty;

  for (const child of children) {
    if (!child || typeof child !== "object") continue;
    const c = child as {
      tagName?: string;
      properties?: { className?: unknown };
      data?: { meta?: string };
    };
    if (c.tagName !== "code") continue;

    const className = c.properties?.className;
    const list = Array.isArray(className) ? className : [className];
    const language = list
      .find(
        (cls): cls is string =>
          typeof cls === "string" && cls.startsWith("language-"),
      )
      ?.match(/language-([\w-]+)/)?.[1];

    return { language, meta: c.data?.meta };
  }

  return empty;
}

// Extract toolbar data before the public article crosses the client boundary.
// Sending `node` would duplicate the entire highlighted code tree in the payload.
const ArticleCodeBlock: NonNullable<Components["pre"]> = ({
  node,
  children,
  className,
}) => {
  const { language, meta } = codeInfo(node);
  const { title } = parseCodeMeta(meta);
  return (
    <CodeBlock language={language} title={title} className={className}>
      {children}
    </CodeBlock>
  );
};

function createHeadingComponent(
  tag: "h2" | "h3",
  headingIds: Map<number, string>,
): NonNullable<Components["h2"]> {
  const Heading = tag;

  return function ArticleHeading({ node, children, ...props }) {
    const id = headingIds.get(node?.position?.start.line ?? -1);

    return (
      <Heading {...props} id={id} tabIndex={id ? -1 : undefined}>
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
        a: ArticleLink,
        table: ArticleTable,
        pre: ArticleCodeBlock,
        blockquote: Callout,
      }
    : undefined;

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkCallouts]}
      rehypePlugins={[
        [
          rehypeHighlight,
          {
            detect: true,
            subset: detectedLanguages,
            plainText: ["text", "txt"],
          },
        ],
        // Must follow rehype-highlight: it splits the highlighted output.
        rehypeCodeLines,
      ]}
      urlTransform={urlTransform}
      components={components}
    >
      {content}
    </ReactMarkdown>
  );
}
