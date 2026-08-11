"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  Link2,
  Code,
  SquareCode,
  Quote,
  List,
  ListOrdered,
  Image as ImageIcon,
  Minus,
} from "lucide-react";
import { savePost, deletePost } from "@/app/admin/actions";
import MarkdownContent from "@/components/markdown/markdown-content";
import { createClient } from "@/lib/supabase/client";
import PostCover from "@/components/posts/post-cover";
import type { Post } from "@/lib/posts";

interface PendingImage {
  file: File;
  objectUrl: string;
}

// Upload paths contain a timestamp, so each URL is immutable and can be
// cached by browsers and the CDN for one year.
const PUBLIC_MEDIA_CACHE_SECONDS = "31536000";

const inputClass =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-ring";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

type Mode = "write" | "split" | "preview";

interface PostFormProps {
  post?: Post;
  error?: string;
}

export default function PostForm({ post, error }: PostFormProps) {
  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(post));
  const [content, setContent] = useState(post?.content ?? "");
  const [coverImageUrl, setCoverImageUrl] = useState(
    post?.cover_image_url ?? "",
  );
  const [coverImageAlt, setCoverImageAlt] = useState(
    post?.cover_image_alt ?? "",
  );
  const [coverPreviewUrl, setCoverPreviewUrl] = useState(
    post?.cover_image_url ?? "",
  );
  const [mode, setMode] = useState<Mode>("write");
  const [draftRestored, setDraftRestored] = useState(false);
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);
  // Images picked in the editor but not yet uploaded. They live only in the
  // browser until Save — referenced from markdown as local:<id>.
  const pendingImages = useRef<Map<string, PendingImage>>(new Map());
  const pendingCoverImage = useRef<PendingImage | null>(null);

  const draftKey = `post-draft-${post?.id ?? "new"}`;

  // Restore unsaved draft (e.g. after accidental tab close). Deferred a tick
  // so it doesn't set state synchronously during the mount effect.
  useEffect(() => {
    const t = setTimeout(() => {
      const draft = localStorage.getItem(draftKey);
      if (draft && draft !== (post?.content ?? "")) {
        setContent(draft);
        setDraftRestored(true);
      }
    }, 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Back up content while typing (debounced)
  useEffect(() => {
    const t = setTimeout(() => {
      if (content) localStorage.setItem(draftKey, content);
    }, 500);
    return () => clearTimeout(t);
  }, [content, draftKey]);

  const clearDraft = () => localStorage.removeItem(draftKey);

  // --- editing helpers -----------------------------------------------------

  const applyEdit = useCallback(
    (
      transform: (
        selected: string,
        full: string,
        start: number,
        end: number,
      ) => { text: string; selStart: number; selEnd: number },
    ) => {
      const el = textareaRef.current;
      if (!el) return;
      const { selectionStart: start, selectionEnd: end, value } = el;
      const selected = value.slice(start, end);
      const { text, selStart, selEnd } = transform(selected, value, start, end);
      setContent(text);
      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(selStart, selEnd);
      });
    },
    [],
  );

  const wrap = useCallback(
    (before: string, after: string, placeholder: string) =>
      applyEdit((selected, full, start, end) => {
        const body = selected || placeholder;
        const text =
          full.slice(0, start) + before + body + after + full.slice(end);
        return {
          text,
          selStart: start + before.length,
          selEnd: start + before.length + body.length,
        };
      }),
    [applyEdit],
  );

  const prefixLines = useCallback(
    (prefix: string | ((i: number) => string)) =>
      applyEdit((selected, full, start, end) => {
        // Expand to whole lines
        const lineStart = full.lastIndexOf("\n", start - 1) + 1;
        const lineEndIdx = full.indexOf("\n", end);
        const lineEnd = lineEndIdx === -1 ? full.length : lineEndIdx;
        const block = full.slice(lineStart, lineEnd);
        const prefixed = block
          .split("\n")
          .map((line, i) =>
            (typeof prefix === "function" ? prefix(i) : prefix) + line,
          )
          .join("\n");
        const text = full.slice(0, lineStart) + prefixed + full.slice(lineEnd);
        return {
          text,
          selStart: lineStart,
          selEnd: lineStart + prefixed.length,
        };
      }),
    [applyEdit],
  );

  const insertBlock = useCallback(
    (block: string) =>
      applyEdit((_selected, full, start, end) => {
        const needsNewline = start > 0 && full[start - 1] !== "\n";
        const insertion = (needsNewline ? "\n\n" : "") + block + "\n";
        const text = full.slice(0, start) + insertion + full.slice(end);
        const pos = start + insertion.length;
        return { text, selStart: pos, selEnd: pos };
      }),
    [applyEdit],
  );

  const insertLink = useCallback(() => {
    const url = prompt("Link URL:", "https://");
    if (url) wrap("[", `](${url})`, "link text");
  }, [wrap]);

  const insertImage = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const onImagePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      toast.error("Max file size is 50 MB (Supabase free tier limit).");
      return;
    }
    const id = crypto.randomUUID();
    pendingImages.current.set(id, {
      file,
      objectUrl: URL.createObjectURL(file),
    });
    const alt = file.name.replace(/\.[^.]+$/, "");
    insertBlock(`![${alt}](local:${id})`);
  };

  const clearPendingCoverImage = () => {
    if (pendingCoverImage.current) {
      URL.revokeObjectURL(pendingCoverImage.current.objectUrl);
      pendingCoverImage.current = null;
    }
  };

  const onCoverImagePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      toast.error("Max file size is 50 MB (Supabase free tier limit).");
      return;
    }

    clearPendingCoverImage();
    const objectUrl = URL.createObjectURL(file);
    pendingCoverImage.current = { file, objectUrl };
    setCoverPreviewUrl(objectUrl);
    if (!coverImageAlt) {
      setCoverImageAlt(file.name.replace(/\.[^.]+$/, ""));
    }
  };

  const setRemoteCoverImage = (url: string) => {
    clearPendingCoverImage();
    setCoverImageUrl(url);
    setCoverPreviewUrl(url);
  };

  const removeCoverImage = () => {
    clearPendingCoverImage();
    setCoverImageUrl("");
    setCoverPreviewUrl("");
  };

  // Lets the preview render not-yet-uploaded images from browser memory
  const resolveImageUrl = (url: string) => {
    if (url.startsWith("local:")) {
      return pendingImages.current.get(url.slice(6))?.objectUrl ?? "";
    }
    return url;
  };

  // Upload images still referenced in the content, then swap local: ids for
  // real storage URLs. Runs only on Save — never while writing.
  const uploadPendingImages = async (text: string) => {
    const referenced = [...pendingImages.current.entries()].filter(([id]) =>
      text.includes(`local:${id}`),
    );
    if (referenced.length === 0) return text;

    const supabase = createClient();
    let result = text;
    for (const [id, { file }] of referenced) {
      const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
      const path = `posts/${Date.now()}-${slugify(file.name.replace(/\.[^.]+$/, "")) || "image"}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("media")
        .upload(path, file, {
          contentType: file.type,
          cacheControl: PUBLIC_MEDIA_CACHE_SECONDS,
        });
      if (uploadError) {
        throw new Error(`Image upload failed: ${uploadError.message}`);
      }
      const { data } = supabase.storage.from("media").getPublicUrl(path);
      result = result.replaceAll(`local:${id}`, data.publicUrl);
    }
    return result;
  };

  const uploadPendingCoverImage = async () => {
    const pending = pendingCoverImage.current;
    if (!pending) return coverImageUrl.trim();

    const { file } = pending;
    const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
    const postPath = slugify(slug || title) || "post";
    const path = `posts/${postPath}/cover-${Date.now()}.${ext}`;
    const supabase = createClient();
    const { error: uploadError } = await supabase.storage
      .from("media")
      .upload(path, file, {
        contentType: file.type,
        cacheControl: PUBLIC_MEDIA_CACHE_SECONDS,
      });
    if (uploadError) {
      throw new Error(`Banner upload failed: ${uploadError.message}`);
    }
    const { data } = supabase.storage.from("media").getPublicUrl(path);
    return data.publicUrl;
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    const form = e.currentTarget;
    const submitter = (e.nativeEvent as SubmitEvent)
      .submitter as HTMLButtonElement | null;
    // Delete button has its own formAction — let it through untouched
    if (submitter?.getAttribute("formaction")) {
      clearDraft();
      return;
    }
    e.preventDefault();
    setSaving(true);
    try {
      const finalContent = await uploadPendingImages(content);
      const finalCoverImageUrl = await uploadPendingCoverImage();
      // local: refs can survive a page reload in the restored draft, but the
      // files themselves don't — block the save instead of publishing 404s
      if (/\]\(local:[0-9a-f-]+\)/.test(finalContent)) {
        throw new Error(
          "Some images were lost when the page reloaded. Remove the broken image references (local:…) and re-add the files.",
        );
      }
      clearPendingCoverImage();
      setContent(finalContent);
      setCoverImageUrl(finalCoverImageUrl);
      setCoverPreviewUrl(finalCoverImageUrl);
      const fd = new FormData(form);
      fd.set("content", finalContent);
      fd.set("cover_image_url", finalCoverImageUrl);
      fd.set("cover_image_alt", coverImageAlt.trim());
      clearDraft();
      await savePost(fd); // redirects on success
    } catch (err) {
      setSaving(false);
      toast.error(err instanceof Error ? err.message : "Save failed");
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const mod = e.metaKey || e.ctrlKey;
    if (!mod) return;
    const key = e.key.toLowerCase();
    if (key === "b") {
      e.preventDefault();
      wrap("**", "**", "bold");
    } else if (key === "i") {
      e.preventDefault();
      wrap("*", "*", "italic");
    } else if (key === "k") {
      e.preventDefault();
      insertLink();
    } else if (key === "e") {
      e.preventDefault();
      wrap("`", "`", "code");
    }
  };

  // --- stats ---------------------------------------------------------------

  const words = content.trim() ? content.trim().split(/\s+/).length : 0;
  const minutes = Math.max(1, Math.round(words / 200));

  const toolbar: {
    icon: React.ReactNode;
    label: string;
    action: () => void;
  }[] = [
    {
      icon: <Bold className="h-3.5 w-3.5" />,
      label: "Bold (⌘B)",
      action: () => wrap("**", "**", "bold"),
    },
    {
      icon: <Italic className="h-3.5 w-3.5" />,
      label: "Italic (⌘I)",
      action: () => wrap("*", "*", "italic"),
    },
    {
      icon: <Heading2 className="h-3.5 w-3.5" />,
      label: "Heading",
      action: () => prefixLines("## "),
    },
    {
      icon: <Heading3 className="h-3.5 w-3.5" />,
      label: "Subheading",
      action: () => prefixLines("### "),
    },
    {
      icon: <Link2 className="h-3.5 w-3.5" />,
      label: "Link (⌘K)",
      action: insertLink,
    },
    {
      icon: <Code className="h-3.5 w-3.5" />,
      label: "Inline code (⌘E)",
      action: () => wrap("`", "`", "code"),
    },
    {
      icon: <SquareCode className="h-3.5 w-3.5" />,
      label: "Code block (TSX)",
      action: () => wrap("```tsx\n", "\n```", "code"),
    },
    {
      icon: <Quote className="h-3.5 w-3.5" />,
      label: "Quote",
      action: () => prefixLines("> "),
    },
    {
      icon: <List className="h-3.5 w-3.5" />,
      label: "Bullet list",
      action: () => prefixLines("- "),
    },
    {
      icon: <ListOrdered className="h-3.5 w-3.5" />,
      label: "Numbered list",
      action: () => prefixLines((i) => `${i + 1}. `),
    },
    {
      icon: <ImageIcon className="h-3.5 w-3.5" />,
      label: "Image (uploads on Save)",
      action: insertImage,
    },
    {
      icon: <Minus className="h-3.5 w-3.5" />,
      label: "Divider",
      action: () => insertBlock("---"),
    },
  ];

  const editorVisible = mode !== "preview";
  const previewVisible = mode !== "write";

  return (
    <form action={savePost} onSubmit={onSubmit}>
      {post && <input type="hidden" name="id" value={post.id} />}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={onImagePicked}
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
      />
      <input
        ref={coverFileInputRef}
        type="file"
        accept="image/*"
        onChange={onCoverImagePicked}
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
      />

      {error && (
        <p className="mb-6 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </p>
      )}
      {draftRestored && (
        <p className="mb-6 rounded-md border border-primary/40 bg-primary/5 p-3 text-sm text-primary">
          Restored an unsaved draft from this browser.
        </p>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        <label
          className="flex flex-col gap-1.5 text-sm"
          title="The post headline, shown on the blog list and at the top of the post"
        >
          <span className="text-muted-foreground">Title</span>
          <input
            name="title"
            required
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (!slugTouched) setSlug(slugify(e.target.value));
            }}
            className={inputClass}
          />
        </label>
        <label
          className="flex flex-col gap-1.5 text-sm"
          title="The post's URL: yoursite.com/blog/<slug>. Auto-generated from the title; changing it after publishing breaks old links"
        >
          <span className="text-muted-foreground">Slug</span>
          <input
            name="slug"
            required
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(slugify(e.target.value));
            }}
            className={`${inputClass} font-mono`}
          />
        </label>
      </div>

      <label
        className="mt-5 flex flex-col gap-1.5 text-sm"
        title="1–2 sentence summary shown under the title on the blog list and used as the meta description for search engines and link previews. Not part of the article"
      >
        <span className="text-muted-foreground">Excerpt</span>
        <input
          name="excerpt"
          defaultValue={post?.excerpt ?? ""}
          className={inputClass}
        />
      </label>

      <section className="mt-5 rounded-md border border-border p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-medium text-foreground">
              Article banner
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Used on the home page, blog cards, article page, and social
              previews. A 1600 × 900 image works well.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => coverFileInputRef.current?.click()}
              className="rounded-md border border-border px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-secondary"
            >
              Upload image
            </button>
            {coverPreviewUrl && (
              <button
                type="button"
                onClick={removeCoverImage}
                className="rounded-md border border-destructive/40 px-3 py-1.5 text-xs text-destructive transition-colors hover:bg-destructive/5"
              >
                Remove
              </button>
            )}
          </div>
        </div>

        {/* Same component the public site renders, so the preview is truthful
            — including the plate shown when no banner is set. */}
        <PostCover
          post={{
            title: title || "Your article title",
            cover_image_url: coverPreviewUrl,
            cover_image_alt: coverImageAlt,
          }}
          className="mt-4"
        />
        {!coverPreviewUrl && (
          <p className="mt-2 text-xs text-muted-foreground">
            No banner set — cards fall back to this plate, and the article page
            opens straight into the text.
          </p>
        )}

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-muted-foreground">Image URL</span>
            <input
              name="cover_image_url"
              type="url"
              value={coverImageUrl}
              onChange={(e) => setRemoteCoverImage(e.target.value)}
              placeholder="https://…"
              className={`${inputClass} font-mono`}
            />
          </label>
          <label
            className="flex flex-col gap-1.5 text-sm"
            title="Describe the image for screen readers. Empty = article title"
          >
            <span className="text-muted-foreground">Alternative text</span>
            <input
              name="cover_image_alt"
              value={coverImageAlt}
              onChange={(e) => setCoverImageAlt(e.target.value)}
              placeholder={title || "Defaults to article title"}
              className={inputClass}
            />
          </label>
        </div>
      </section>

      <div className="mt-6">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-t-md border border-b-0 border-input bg-secondary/50 px-2 py-1.5">
          <div className="flex flex-wrap items-center gap-0.5">
            {/* False positive: the ref is only read inside event handlers */}
            {/* eslint-disable-next-line react-hooks/refs */}
            {toolbar.map((tool) => (
              <button
                key={tool.label}
                type="button"
                title={tool.label}
                aria-label={tool.label}
                onClick={tool.action}
                className="inline-flex h-8 w-8 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                {tool.icon}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-0.5">
            {(["write", "split", "preview"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                title={
                  m === "write"
                    ? "Editor only"
                    : m === "split"
                      ? "Editor and live preview side by side"
                      : "Rendered result only"
                }
                onClick={() => setMode(m)}
                className={`rounded px-2.5 py-1 text-xs capitalize transition-colors ${
                  mode === m
                    ? "bg-background text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Editor / preview panes */}
        <div
          className={`grid rounded-b-md border border-input ${
            mode === "split" ? "md:grid-cols-2" : ""
          }`}
        >
          <textarea
            ref={textareaRef}
            name="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={onKeyDown}
            rows={24}
            placeholder="Write in Markdown…"
            className={`w-full resize-y bg-background p-4 font-mono text-sm leading-relaxed text-foreground outline-none ${
              editorVisible ? "" : "hidden"
            } ${mode === "split" ? "md:border-r md:border-border" : ""}`}
          />
          {previewVisible && (
            <div className="markdown max-h-[40rem] overflow-y-auto p-6">
              {content.trim() ? (
                <MarkdownContent
                  content={content}
                  urlTransform={resolveImageUrl}
                />
              ) : (
                <p className="text-muted-foreground">Nothing to preview yet.</p>
              )}
            </div>
          )}
        </div>

        <p className="mt-2 text-right font-mono text-xs text-muted-foreground">
          {words} words · ~{minutes} min read
        </p>
      </div>

      {/* Per-post SEO metadata */}
      <details className="mt-6 rounded-md border border-border">
        <summary className="cursor-pointer px-4 py-3 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground">
          SEO metadata
        </summary>
        <div className="flex flex-col gap-4 border-t border-border p-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label
              className="flex flex-col gap-1.5 text-sm"
              title="Overrides the post title in search results and link previews. Empty = post title"
            >
              <span className="text-muted-foreground">Meta title</span>
              <input
                name="meta_title"
                defaultValue={post?.meta?.title ?? ""}
                placeholder={title || "Defaults to post title"}
                className={inputClass}
              />
            </label>
            <label
              className="flex flex-col gap-1.5 text-sm"
              title="Comma-separated keywords for search engines"
            >
              <span className="text-muted-foreground">Keywords</span>
              <input
                name="meta_keywords"
                defaultValue={post?.meta?.keywords ?? ""}
                placeholder="react native, expo, …"
                className={inputClass}
              />
            </label>
          </div>
          <label
            className="flex flex-col gap-1.5 text-sm"
            title="Overrides the description in search results and link previews. Empty = excerpt"
          >
            <span className="text-muted-foreground">Meta description</span>
            <input
              name="meta_description"
              defaultValue={post?.meta?.description ?? ""}
              placeholder="Defaults to excerpt"
              className={inputClass}
            />
          </label>
          <label
            className="flex flex-col gap-1.5 text-sm"
            title="Optional override for link previews when sharing on social. Empty = article banner"
          >
            <span className="text-muted-foreground">Social share image URL</span>
            <input
              name="meta_og_image"
              type="url"
              defaultValue={post?.meta?.ogImage ?? ""}
              placeholder="Defaults to article banner"
              className={`${inputClass} font-mono`}
            />
          </label>
        </div>
      </details>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <label
            className="flex items-center gap-2.5 text-sm"
            title="Checked: post is live on /blog. Unchecked: draft, visible only here"
          >
            <input
              type="checkbox"
              name="published"
              defaultChecked={post?.published ?? false}
              className="h-4 w-4 accent-[var(--primary)]"
            />
            <span>Published</span>
          </label>
          <label
            className="flex items-center gap-2.5 text-sm"
            title="Show this post in the Writing section on the home page once it is published"
          >
            <input
              type="checkbox"
              name="show_on_home"
              defaultChecked={post?.show_on_home ?? false}
              className="h-4 w-4 accent-[var(--primary)]"
            />
            <span>Show on home</span>
          </label>
        </div>

        <div className="flex items-center gap-3">
          {post && (
            <button
              type="submit"
              formAction={deletePost}
              formNoValidate
              onClick={(e) => {
                if (!confirm("Delete this post permanently?")) {
                  e.preventDefault();
                } else {
                  clearDraft();
                }
              }}
              className="rounded-md border border-destructive/40 px-4 py-2 text-sm text-destructive transition-colors hover:bg-destructive/5"
            >
              Delete
            </button>
          )}
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {saving ? "Uploading…" : "Save"}
          </button>
        </div>
      </div>
    </form>
  );
}
