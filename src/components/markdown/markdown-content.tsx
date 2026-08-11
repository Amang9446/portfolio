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
        pre: CodeBlock,
      }
    : undefined;

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
      components={components}
    >
      {content}
    </ReactMarkdown>
  );
}
