export type ProjectMediaKind = "image" | "video" | "link";

export interface ProjectMediaItem {
  kind: ProjectMediaKind;
  url: string;
  alt?: string;
  caption?: string;
  label?: string;
}

const MEDIA_KINDS = new Set<ProjectMediaKind>(["image", "video", "link"]);
const MAX_MEDIA_ITEMS = 30;

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export function isAllowedMediaUrl(value: string) {
  if (value.startsWith("/")) return true;
  return isHttpUrl(value);
}

export function parseProjectMedia(value: unknown): ProjectMediaItem[] {
  if (!Array.isArray(value)) return [];

  const items: ProjectMediaItem[] = [];
  for (const raw of value) {
    if (items.length >= MAX_MEDIA_ITEMS) break;
    if (!raw || typeof raw !== "object") continue;

    const record = raw as Record<string, unknown>;
    const kind = record.kind;
    const url = String(record.url ?? "").trim();
    if (
      typeof kind !== "string" ||
      !MEDIA_KINDS.has(kind as ProjectMediaKind) ||
      !url ||
      !isAllowedMediaUrl(url)
    ) {
      continue;
    }

    const item: ProjectMediaItem = { kind: kind as ProjectMediaKind, url };
    const alt = String(record.alt ?? "").trim();
    const caption = String(record.caption ?? "").trim();
    const label = String(record.label ?? "").trim();
    if (alt) item.alt = alt;
    if (caption) item.caption = caption;
    if (label) item.label = label;
    items.push(item);
  }

  return items;
}

export function hasCaseStudyContent(input: {
  role?: string;
  problem?: string;
  architecture?: string;
  challenges?: string;
  results?: string;
  media?: ProjectMediaItem[];
}) {
  return Boolean(
    input.role?.trim() ||
      input.problem?.trim() ||
      input.architecture?.trim() ||
      input.challenges?.trim() ||
      input.results?.trim() ||
      (input.media && input.media.length > 0),
  );
}

export function youtubeVideoId(url: string) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      return parsed.pathname.split("/").filter(Boolean)[0] ?? null;
    }
    if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
      if (parsed.pathname === "/watch") return parsed.searchParams.get("v");
      const parts = parsed.pathname.split("/").filter(Boolean);
      if (parts[0] === "embed" || parts[0] === "shorts" || parts[0] === "live") {
        return parts[1] ?? null;
      }
    }
  } catch {
    return null;
  }
  return null;
}

export function vimeoVideoId(url: string) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    if (host !== "vimeo.com" && host !== "player.vimeo.com") return null;
    const parts = parsed.pathname.split("/").filter(Boolean);
    const id = host === "player.vimeo.com" && parts[0] === "video" ? parts[1] : parts[0];
    return id && /^\d+$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

export function isDirectVideoFile(url: string) {
  try {
    const path = new URL(url).pathname.toLowerCase();
    return [".mp4", ".webm", ".ogg", ".mov"].some((ext) => path.endsWith(ext));
  } catch {
    return false;
  }
}
