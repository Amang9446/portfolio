"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  savePost,
  deletePost,
  checkPostSlugAvailability,
} from "@/app/admin/actions";
import { defaultUrlTransform } from "react-markdown";
import { resolveAdminErrorMessage } from "@/lib/admin-feedback";
import MarkdownContent from "@/components/markdown/markdown-content";
import EditorToolbar, {
  EDITOR_MODES,
  type EditorActions,
  type EditorMode,
} from "@/components/admin/editor-toolbar";
import TagInput from "@/components/admin/tag-input";
import { useDraftBackup } from "@/components/admin/use-draft-backup";
import { useMarkdownEditor } from "@/components/admin/use-markdown-editor";
import { createClient } from "@/lib/supabase/client";
import {
  continueOnEnter,
  editorStats,
  indentLines,
  insertBlock,
  insertTab,
  linkPastedUrl,
  prefixLines,
  slugify,
  toggleHeading,
  wrapSelection,
} from "@/lib/markdown-commands";
import PostCover from "@/components/posts/post-cover";
import type { Post } from "@/lib/posts";

interface PendingImage {
  file: File;
  objectUrl: string;
}

// Upload paths contain a timestamp, so each URL is immutable and can be
// cached by browsers and the CDN for one year.
const PUBLIC_MEDIA_CACHE_SECONDS = "31536000";
const MAX_IMAGE_BYTES = 50 * 1024 * 1024;
// Roughly where search engines start truncating descriptions
const EXCERPT_HINT_LENGTH = 160;

const inputClass =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-ring";

type SlugStatus = "idle" | "checking" | "available" | "taken";

interface PostFormProps {
  post?: Post;
  error?: string;
}

export default function PostForm({ post, error }: PostFormProps) {
  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(post));
  const [slugCheck, setSlugStatus] = useState<{
    slug: string;
    status: SlugStatus;
  }>({ slug: "", status: "idle" });
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [tags, setTags] = useState<string[]>(post?.tags ?? []);
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
  const [mode, setMode] = useState<EditorMode>("write");
  const [dragActive, setDragActive] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [saving, setSaving] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);
  // Images picked in the editor but not yet uploaded. They live only in the
  // browser until Save — referenced from markdown as local:<id>.
  const pendingImages = useRef<Map<string, PendingImage>>(new Map());
  const pendingCoverImage = useRef<PendingImage | null>(null);

  const editorVisible = mode !== "preview";
  const previewVisible = mode !== "write";
  const { textareaRef, cursor, updateCursor, run } = useMarkdownEditor({
    content,
    setContent,
    visible: editorVisible,
  });

  const {
    restored: draftRestored,
    backedUpAt,
    clearDraft,
  } = useDraftBackup(
    `post-draft-${post?.id ?? "new"}`,
    content,
    post?.content ?? "",
    setContent,
  );

  // Live slug availability — catches "duplicate slug" before Save does,
  // when fixing it is still cheap. The status is keyed to the slug it was
  // computed for, so reverting the input can never show a stale verdict.
  useEffect(() => {
    if (!slug || slug === post?.slug) return;
    const timer = setTimeout(() => {
      setSlugStatus({ slug, status: "checking" });
      checkPostSlugAvailability(slug, post?.id)
        .then((result) =>
          setSlugStatus({
            slug,
            status: result.checked && result.taken ? "taken" : "available",
          }),
        )
        .catch(() => setSlugStatus({ slug, status: "idle" }));
    }, 400);
    return () => clearTimeout(timer);
  }, [slug, post?.id, post?.slug]);

  const slugStatus: SlugStatus =
    slugCheck.slug === slug && slug !== post?.slug ? slugCheck.status : "idle";

  // Warn before leaving with edits that exist only in this tab. A just-saved
  // flag suppresses the warning for the post-save redirect.
  const dirty =
    title !== (post?.title ?? "") ||
    slug !== (post?.slug ?? "") ||
    excerpt !== (post?.excerpt ?? "") ||
    content !== (post?.content ?? "") ||
    coverImageUrl !== (post?.cover_image_url ?? "") ||
    coverImageAlt !== (post?.cover_image_alt ?? "") ||
    tags.join(",") !== (post?.tags ?? []).join(",");
  const justSavedRef = useRef(false);
  useEffect(() => {
    if (!dirty) return;
    const handler = (event: BeforeUnloadEvent) => {
      if (justSavedRef.current) return;
      event.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  // --- images --------------------------------------------------------------

  const addPendingImages = useCallback(
    (files: File[]) => {
      let accepted = 0;
      for (const file of files) {
        if (!file.type.startsWith("image/")) continue;
        if (file.size > MAX_IMAGE_BYTES) {
          toast.error(`"${file.name}" exceeds the 50 MB upload limit.`);
          continue;
        }
        const id = crypto.randomUUID();
        pendingImages.current.set(id, {
          file,
          objectUrl: URL.createObjectURL(file),
        });
        const alt = file.name.replace(/\.[^.]+$/, "");
        run(insertBlock(`![${alt}](local:${id})`));
        accepted++;
      }
      if (files.length > 0 && accepted === 0) {
        toast.error("Only image files can be inserted.");
      }
    },
    [run],
  );

  const insertImage = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const onImagePicked = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length > 0) addPendingImages(files);
  };

  const clearPendingCoverImage = () => {
    if (pendingCoverImage.current) {
      URL.revokeObjectURL(pendingCoverImage.current.objectUrl);
      pendingCoverImage.current = null;
    }
  };

  const onCoverImagePicked = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > MAX_IMAGE_BYTES) {
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
  // while preserving react-markdown's default URL sanitization for all other URLs.
  const resolveImageUrl = (url: string) => {
    if (url.startsWith("local:")) {
      return pendingImages.current.get(url.slice(6))?.objectUrl ?? "";
    }
    return defaultUrlTransform(url);
  };

  // --- formatting actions --------------------------------------------------

  const insertLink = useCallback(() => {
    const url = prompt("Link URL:", "https://");
    if (url) run(wrapSelection("[", `](${url})`, "link text"));
  }, [run]);

  const cycleMode = useCallback(() => {
    setMode((current) => {
      const next = EDITOR_MODES.indexOf(current) + 1;
      return EDITOR_MODES[next % EDITOR_MODES.length];
    });
  }, []);

  const actions: EditorActions = {
    bold: () => run(wrapSelection("**", "**", "bold")),
    italic: () => run(wrapSelection("*", "*", "italic")),
    strikethrough: () => run(wrapSelection("~~", "~~", "strikethrough")),
    heading: () => run(toggleHeading(2)),
    subheading: () => run(toggleHeading(3)),
    link: insertLink,
    inlineCode: () => run(wrapSelection("`", "`", "code")),
    codeBlock: () => run(wrapSelection("```tsx\n", "\n```", "code")),
    quote: () => run(prefixLines("> ")),
    bulletList: () => run(prefixLines("- ")),
    numberedList: () => run(prefixLines((index) => `${index + 1}. `)),
    taskList: () => run(prefixLines("- [ ] ")),
    image: insertImage,
    table: () =>
      run(
        insertBlock(
          "| Column | Column | Column |\n| --- | --- | --- |\n|  |  |  |",
        ),
      ),
    divider: () => run(insertBlock("---")),
  };

  // --- keyboard & clipboard behaviors --------------------------------------

  const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.metaKey &&
      !event.ctrlKey
    ) {
      if (run(continueOnEnter())) event.preventDefault();
      return;
    }
    if (event.key === "Tab") {
      event.preventDefault();
      const el = textareaRef.current;
      if (!el) return;
      const hasSelection = el.selectionStart !== el.selectionEnd;
      run(
        hasSelection || event.shiftKey
          ? indentLines(event.shiftKey)
          : insertTab(),
      );
      return;
    }

    if (!event.metaKey && !event.ctrlKey) return;
    const key = event.key.toLowerCase();

    // Digit keys are matched by physical position (event.code) because Shift
    // turns event.key into punctuation on most layouts.
    if (event.shiftKey) {
      const shifted: Record<string, (() => void) | undefined> = {
        Digit2: actions.heading,
        Digit3: actions.subheading,
        Digit7: actions.numberedList,
        Digit8: actions.bulletList,
        Period: actions.quote,
      };
      const byCode = shifted[event.code];
      const byKey =
        key === "x"
          ? actions.strikethrough
          : key === "e"
            ? actions.codeBlock
            : key === "i"
              ? actions.image
              : key === "p"
                ? cycleMode
                : undefined;

      const handler = byCode ?? byKey;
      if (handler) {
        event.preventDefault();
        handler();
      }
      return;
    }

    const plain: Record<string, (() => void) | undefined> = {
      b: actions.bold,
      i: actions.italic,
      k: actions.link,
      e: actions.inlineCode,
    };
    const handler = plain[key];
    if (handler) {
      event.preventDefault();
      handler();
    }
  };

  const onPaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const files = Array.from(event.clipboardData?.files ?? []);
    if (files.length > 0) {
      event.preventDefault();
      addPendingImages(files);
      return;
    }
    const pasted = event.clipboardData?.getData("text/plain") ?? "";
    // Pasting a URL onto selected text wraps it into a markdown link
    if (run(linkPastedUrl(pasted))) event.preventDefault();
  };

  const onDrop = (event: React.DragEvent<HTMLTextAreaElement>) => {
    const files = Array.from(event.dataTransfer?.files ?? []);
    if (files.length === 0) return;
    event.preventDefault();
    setDragActive(false);
    addPendingImages(files);
  };

  const onDragOver = (event: React.DragEvent<HTMLTextAreaElement>) => {
    if (!event.dataTransfer?.types.includes("Files")) return;
    event.preventDefault();
    setDragActive(true);
  };

  // --- save ----------------------------------------------------------------

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

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    const form = event.currentTarget;
    const submitter = (event.nativeEvent as SubmitEvent)
      .submitter as HTMLButtonElement | null;
    // Delete button has its own formAction — let it through untouched
    if (submitter?.getAttribute("formaction")) {
      clearDraft();
      return;
    }
    event.preventDefault();
    if (slugStatus === "taken") {
      toast.error("Another post already uses this slug.");
      return;
    }
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
      justSavedRef.current = true; // the save redirect must not trip beforeunload
      await savePost(fd); // redirects on success
    } catch (err) {
      setSaving(false);
      toast.error(err instanceof Error ? err.message : "Save failed");
    }
  };

  // ⌘S saves from anywhere in the form; Escape dismisses the shortcuts panel
  const onFormKeyDown = (event: React.KeyboardEvent<HTMLFormElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
      event.preventDefault();
      formRef.current?.requestSubmit();
    } else if (event.key === "Escape" && showShortcuts) {
      event.preventDefault();
      setShowShortcuts(false);
    }
  };

  const { words, characters, minutes } = editorStats(content);

  return (
    <form
      ref={formRef}
      action={savePost}
      onSubmit={onSubmit}
      onKeyDown={onFormKeyDown}
    >
      {post && <input type="hidden" name="id" value={post.id} />}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
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
          {resolveAdminErrorMessage(error)}
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
            onChange={(event) => {
              setTitle(event.target.value);
              if (!slugTouched) setSlug(slugify(event.target.value));
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
            onChange={(event) => {
              setSlugTouched(true);
              setSlug(slugify(event.target.value));
            }}
            aria-invalid={slugStatus === "taken"}
            className={`${inputClass} font-mono`}
          />
          <span aria-live="polite" className="min-h-4 text-xs">
            {slugStatus === "checking" && (
              <span className="text-muted-foreground">Checking…</span>
            )}
            {slugStatus === "available" && (
              <span className="text-primary">Slug is available</span>
            )}
            {slugStatus === "taken" && (
              <span className="text-destructive">
                Another post already uses this slug
              </span>
            )}
          </span>
        </label>
      </div>

      <label
        className="mt-5 flex flex-col gap-1.5 text-sm"
        title="1–2 sentence summary shown under the title on the blog list, as the lede under the article title, and as the meta description for search engines and link previews."
      >
        <span className="flex items-baseline justify-between text-muted-foreground">
          <span>Excerpt</span>
          <span
            className={`font-mono text-xs ${
              excerpt.length > EXCERPT_HINT_LENGTH ? "text-destructive" : ""
            }`}
          >
            {excerpt.length}/{EXCERPT_HINT_LENGTH}
          </span>
        </span>
        <input
          name="excerpt"
          value={excerpt}
          onChange={(event) => setExcerpt(event.target.value)}
          className={inputClass}
        />
      </label>

      <div className="mt-5">
        <TagInput name="tags" value={tags} onChange={setTags} />
      </div>

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
              onChange={(event) => setRemoteCoverImage(event.target.value)}
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
              onChange={(event) => setCoverImageAlt(event.target.value)}
              placeholder={title || "Defaults to article title"}
              className={inputClass}
            />
          </label>
        </div>
      </section>

      <div className="mt-6">
        <EditorToolbar
          actions={actions}
          mode={mode}
          onModeChange={setMode}
          shortcutsOpen={showShortcuts}
          onShortcutsOpenChange={setShowShortcuts}
        />

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
            onChange={(event) => {
              setContent(event.target.value);
              updateCursor();
            }}
            onKeyDown={onKeyDown}
            onSelect={updateCursor}
            onPaste={onPaste}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={() => setDragActive(false)}
            placeholder="Write in Markdown…"
            spellCheck
            className={`min-h-[26rem] w-full resize-none overflow-hidden bg-background p-4 font-mono text-sm leading-relaxed text-foreground outline-none ${
              dragActive ? "bg-primary/5" : ""
            } ${editorVisible ? "" : "hidden"} ${
              mode === "split" ? "md:border-r md:border-border" : ""
            }`}
          />
          {previewVisible && (
            <div className="markdown max-h-[40rem] overflow-y-auto p-6">
              {content.trim() ? (
                <MarkdownContent
                  content={content}
                  urlTransform={resolveImageUrl}
                  readingExperience
                />
              ) : (
                <p className="text-muted-foreground">Nothing to preview yet.</p>
              )}
            </div>
          )}
        </div>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 font-mono text-xs text-muted-foreground">
          <span>
            Ln {cursor.line}, Col {cursor.col}
            {dragActive && " · drop to insert"}
          </span>
          <span>
            {words} words · {characters} chars · ~{minutes} min read
            {backedUpAt &&
              ` · backed up ${backedUpAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
          </span>
        </div>
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
            <span className="text-muted-foreground">
              Social share image URL
            </span>
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
              onClick={(event) => {
                if (!confirm("Delete this post permanently?")) {
                  event.preventDefault();
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
