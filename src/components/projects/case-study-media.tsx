import type { ProjectMediaItem } from "@/lib/project-media";
import {
  isDirectVideoFile,
  vimeoVideoId,
  youtubeVideoId,
} from "@/lib/project-media";

interface CaseStudyMediaProps {
  items: ProjectMediaItem[];
  title: string;
}

function EmbedFrame({
  src,
  title,
}: {
  src: string;
  title: string;
}) {
  return (
    <div className="relative aspect-video overflow-hidden rounded-xl border border-border bg-muted">
      <iframe
        src={src}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="absolute inset-0 h-full w-full"
      />
    </div>
  );
}

function MediaItem({
  item,
  fallbackTitle,
}: {
  item: ProjectMediaItem;
  fallbackTitle: string;
}) {
  if (item.kind === "image") {
    const alt = item.alt?.trim() || item.caption?.trim() || fallbackTitle;
    return (
      <figure>
        {/* Gallery shots vary in aspect ratio; avoid cropping them in a fixed frame. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.url}
          alt={alt}
          loading="lazy"
          decoding="async"
          className="w-full rounded-xl border border-border"
        />
        {item.caption ? (
          <figcaption className="mt-3 font-mono text-xs leading-relaxed text-muted-foreground">
            {item.caption}
          </figcaption>
        ) : null}
      </figure>
    );
  }

  if (item.kind === "video") {
    const youtubeId = youtubeVideoId(item.url);
    const vimeoId = vimeoVideoId(item.url);
    const label = item.caption?.trim() || fallbackTitle;
    let player = null;

    if (youtubeId) {
      player = (
        <EmbedFrame
          src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(youtubeId)}`}
          title={label}
        />
      );
    } else if (vimeoId) {
      player = (
        <EmbedFrame
          src={`https://player.vimeo.com/video/${encodeURIComponent(vimeoId)}`}
          title={label}
        />
      );
    } else if (isDirectVideoFile(item.url)) {
      player = (
        <video
          controls
          preload="metadata"
          className="w-full rounded-xl border border-border"
          src={item.url}
        >
          <a href={item.url}>{label}</a>
        </video>
      );
    } else {
      player = (
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-primary transition-opacity hover:opacity-80"
        >
          {label}
        </a>
      );
    }

    return (
      <figure>
        {player}
        {item.caption && (youtubeId || vimeoId || isDirectVideoFile(item.url)) ? (
          <figcaption className="mt-3 font-mono text-xs leading-relaxed text-muted-foreground">
            {item.caption}
          </figcaption>
        ) : null}
      </figure>
    );
  }

  const label = item.label?.trim() || item.caption?.trim() || item.url;
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 font-medium text-primary transition-opacity hover:opacity-80"
    >
      {label}
    </a>
  );
}

export default function CaseStudyMedia({ items, title }: CaseStudyMediaProps) {
  if (items.length === 0) return null;

  return (
    <section className="mt-16 border-t border-border pt-12 md:mt-20 md:pt-16">
      <h2 className="text-xl font-semibold md:text-2xl">
        Screenshots, diagrams, videos, and links
      </h2>
      <div className="mt-8 flex flex-col gap-10">
        {items.map((item, index) => (
          <MediaItem
            key={`${item.kind}-${item.url}-${index}`}
            item={item}
            fallbackTitle={title}
          />
        ))}
      </div>
    </section>
  );
}
