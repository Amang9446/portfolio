import type { Post } from "@/lib/posts";
import type { SiteContent } from "@/lib/settings";
import { absoluteUrl } from "@/lib/site-url";
import { socialImageUrl } from "@/lib/social-image";

type JsonLd = Record<string, unknown>;

const SCHEMA_CONTEXT = "https://schema.org";

/**
 * Serialize for embedding in `<script type="application/ld+json">`.
 *
 * Several entities per page are emitted as a single `@graph`, never as a
 * top-level array. Both forms are valid JSON-LD, but plenty of real consumers
 * (SEO extensions, preview scrapers) read `data["@context"]` straight off the
 * parsed value and throw on an array — the builders below therefore return
 * bare entities and the context is stamped exactly once, here.
 *
 * Post content is author-controlled but still untrusted-shaped text, and a
 * literal `</script>` inside any string would end the block early — escaping
 * `<` makes that impossible while staying valid JSON.
 */
export function jsonLdScript(data: JsonLd | JsonLd[]) {
  const document = Array.isArray(data)
    ? { "@context": SCHEMA_CONTEXT, "@graph": data }
    : { "@context": SCHEMA_CONTEXT, ...data };

  return JSON.stringify(document).replace(/</g, "\\u003c");
}

function personJsonLd(site: SiteContent): JsonLd {
  return {
    "@type": "Person",
    name: site.metadata.author,
    url: absoluteUrl("/"),
    jobTitle: site.hero.title,
    sameAs: site.contact.socialLinks.map((link) => link.url),
  };
}

export function homeJsonLd(site: SiteContent): JsonLd[] {
  return [
    {
      ...personJsonLd(site),
      description: site.metadata.description,
      email: `mailto:${site.contact.email}`,
    },
    {
      "@type": "WebSite",
      name: site.metadata.title,
      url: absoluteUrl("/"),
      description: site.metadata.description,
      author: personJsonLd(site),
    },
  ];
}

export function blogJsonLd(site: SiteContent): JsonLd {
  return {
    "@type": "Blog",
    name: `${site.metadata.author} — Writing`,
    url: absoluteUrl("/blog"),
    description: site.metadata.description,
    author: personJsonLd(site),
  };
}

export function blogPostingJsonLd(post: Post, site: SiteContent): JsonLd {
  const url = absoluteUrl(`/blog/${encodeURIComponent(post.slug)}`);

  return {
    "@type": "BlogPosting",
    headline: post.meta?.title || post.title,
    description: post.meta?.description || post.excerpt || undefined,
    image: socialImageUrl(post.slug, post.updated_at || post.id),
    datePublished: post.published_at ?? undefined,
    dateModified: post.updated_at,
    author: personJsonLd(site),
    publisher: personJsonLd(site),
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
    // Explicit SEO keywords win; tags are the fallback vocabulary.
    keywords: post.meta?.keywords || post.tags.join(", ") || undefined,
  };
}

export function breadcrumbJsonLd(
  trail: { name: string; path: string }[],
): JsonLd {
  return {
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}
