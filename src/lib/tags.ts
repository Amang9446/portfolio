/**
 * Tags are stored as the author typed them ("React Native") and addressed in
 * URLs by slug ("react-native"), so display never loses the original casing.
 */

export const MAX_TAGS_PER_POST = 6;
const MAX_TAG_LENGTH = 32;

export function tagSlug(tag: string) {
  return tag
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s-]+/g, "-");
}

/**
 * Clean up author input: trim, drop empties and anything that slugs to
 * nothing, de-duplicate by slug (first spelling wins), and cap the count.
 */
export function normalizeTags(input: string[]): string[] {
  const bySlug = new Map<string, string>();

  for (const raw of input) {
    const tag = raw.trim().replace(/\s+/g, " ").slice(0, MAX_TAG_LENGTH);
    const slug = tagSlug(tag);
    if (!slug || bySlug.has(slug)) continue;
    bySlug.set(slug, tag);
  }

  return [...bySlug.values()].slice(0, MAX_TAGS_PER_POST);
}

/** Parse the comma-separated value the admin form submits. */
export function parseTagsField(value: string): string[] {
  return normalizeTags(value.split(","));
}
