"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Bold,
  Italic,
  Strikethrough,
  Heading2,
  Heading3,
  Link2,
  Code,
  SquareCode,
  Quote,
  List,
  ListOrdered,
  ListTodo,
  Image as ImageIcon,
  Table as TableIcon,
  Minus,
  CircleHelp,
} from "lucide-react";
import {
  savePost,
  deletePost,
  checkPostSlugAvailability,
} from "@/app/admin/actions";
import MarkdownContent from "@/components/markdown/markdown-content";
import TagInput from "@/components/admin/tag-input";
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
const MAX_IMAGE_BYTES = 50 * 1024 * 1024;
// Roughly where search engines start truncating descriptions
const EXCERPT_HINT_LENGTH = 160;

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

// --- markdown continuation helpers (module-level so they're testable) ------

function continueListPrefix(line: string): string | null {
  const task = line.match(/^(\s*(?:[-*+]|\d+\.)\s+)\[[ xX]\]\s+/);
  if (task) return `${task[1]}[ ] `;
  const unordered = line.match(/^(\s*[-*+]\s+)/);
  if (unordered) return unordered[1];
  const ordered = line.match(/^(\s*)(\d+)(\.\s+)/);
  if (ordered) return `${ordered[1]}${Number(ordered[2]) + 1}${ordered[3]}`;
  const quote = line.match(/^(\s*>+\s*)/);
  if (quote) return quote[1];
  return null;
}

// An "empty" item is a marker with no content — Enter there exits the list.
function emptyMarkerLength(line: string): number {
  const task = line.match(/^(\s*(?:[-*+]|\d+\.)\s+\[[ xX]\]\s*)$/);
  if (task) return task[1].length;
  const unordered = line.match(/^(\s*[-*+]\s*)$/);
  if (unordered) return unordered[1].length;
  const ordered = line.match(/^(\s*\d+\.\s*)$/);
  if (ordered) return ordered[1].length;
  const quote = line.match(/^(\s*>+\s*)$/);
  if (quote) return quote[1].length;
  return 0;
}

type Mode = "write" | "split" | "preview";
type SlugStatus = "idle" | "checking" | "available" | "taken";

const shortcutGroups: {
  group: string;
  items: { keys: string; action: string }[];
}[] = [
  {
    group: "Inline",
    items: [
      { keys: "⌘ B", action: "Bold" },
      { keys: "⌘ I", action: "Italic" },
      { keys: "⌘ ⇧ X", action: "Strikethrough" },
      { keys: "⌘ E", action: "Inline code" },
      { keys: "⌘ K", action: "Insert link" },
    ],
  },
  {
    group: "Blocks",
    items: [
      { keys: "⌘ ⇧ 2", action: "Heading (toggles)" },
      { keys: "⌘ ⇧ 3", action: "Subheading (toggles)" },
      { keys: "⌘ ⇧ E", action: "Code block" },
      { keys: "⌘ ⇧ .", action: "Quote" },
      { keys: "⌘ ⇧ 7", action: "Numbered list" },
      { keys: "⌘ ⇧ 8", action: "Bullet list" },
      { keys: "⌘ ⇧ I", action: "Insert image" },
      { keys: "Tab / ⇧ Tab", action: "Indent / outdent" },
      { keys: "Enter", action: "Continue list / quote; exit on empty item" },
    ],
  },
  {
    group: "Editor",
    items: [
      { keys: "⌘ S", action: "Save post" },
      { keys: "⌘ ⇧ P", action: "Cycle write / split / preview" },
      { keys: "Esc", action: "Close this panel" },
      { keys: "Paste / drop", action: "Image uploads on Save; URL over selection links it" },
    ],
  },
];

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
  const [mode, setMode] = useState<Mode>("write");
  const [draftRestored, setDraftRestored] = useState(false);
  const [backedUpAt, setBackedUpAt] = useState<Date | null>(null);
  const [cursor, setCursor] = useState({ line: 1, col: 1 });
  const [dragActive, setDragActive] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [saving, setSaving] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
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
      if (content) {
        localStorage.setItem(draftKey, content);
        setBackedUpAt(new Date());
      }
    }, 500);
    return () => clearTimeout(t);
  }, [content, draftKey]);

  const clearDraft = () => {
    localStorage.removeItem(draftKey);
    setBackedUpAt(null);
  };

  // Live slug availability — catches "duplicate slug" before Save does,
  // when fixing it is still cheap. The status is keyed to the slug it was
  // computed for, so reverting the input can never show a stale verdict.
  useEffect(() => {
    if (!slug || slug === post?.slug) return;
    const t = setTimeout(() => {
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
    return () => clearTimeout(t);
  }, [slug, post?.id, post?.slug]);

  const slugStatus: SlugStatus =
    slugCheck.slug === slug && slug !== post?.slug ? slugCheck.status : "idle";

  // The textarea grows with the article instead of scrolling internally.
  const editorVisible = mode !== "preview";
  useEffect(() => {
    const el = textareaRef.current;
    if (!el || !editorVisible) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [content, mode, editorVisible]);

  const updateCursor = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    const pos = el.selectionStart;
    const before = el.value.slice(0, pos);
    setCursor({
      line: before.split("\n").length,
      col: pos - before.lastIndexOf("\n"),
    });
  }, []);

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
    const handler = (e: BeforeUnloadEvent) => {
      if (justSavedRef.current) return;
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  // --- editing helpers -----------------------------------------------------

  // Route replacements through execCommand so they join the browser's native
  // undo stack — ⌘Z keeps working after toolbar clicks. Falls back to a
  // direct state update where execCommand is unavailable.
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
      if (text === value) return;

      // Smallest changed span between old and new text
      let p = 0;
      const maxP = Math.min(value.length, text.length);
      while (p < maxP && value[p] === text[p]) p++;
      let s = 0;
      const maxS = Math.min(value.length - p, text.length - p);
      while (
        s < maxS &&
        value[value.length - 1 - s] === text[text.length - 1 - s]
      ) {
        s++;
      }
      const replacement = text.slice(p, text.length - s);

      el.focus();
      el.setSelectionRange(p, value.length - s);
      let inserted = false;
      try {
        inserted = document.execCommand("insertText", false, replacement);
      } catch {
        inserted = false;
      }
      if (!inserted) setContent(text);
      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(selStart, selEnd);
        updateCursor();
      });
    },
    [updateCursor],
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

  // Heading-aware variant of prefixLines: replaces any existing heading
  // level, and pressing it again on an already-heading line removes the
  // prefix — so ⌘⇧2 cycles text → ## → plain instead of stacking "## ## ".
  const toggleHeading = useCallback(
    (level: 2 | 3) =>
      applyEdit((_selected, full, start, end) => {
        const lineStart = full.lastIndexOf("\n", start - 1) + 1;
        const lineEndIdx = full.indexOf("\n", end);
        const lineEnd = lineEndIdx === -1 ? full.length : lineEndIdx;
        const prefix = `${"#".repeat(level)} `;
        const strip = (line: string) => line.replace(/^#{1,6}\s+/, "");
        const lines = full.slice(lineStart, lineEnd).split("\n");
        const allAtLevel = lines
          .filter((line) => line.trim())
          .every((line) => line.startsWith(prefix));
        const changed = lines
          .map((line) => {
            if (!line.trim()) return line;
            return allAtLevel ? strip(line) : prefix + strip(line);
          })
          .join("\n");
        const text = full.slice(0, lineStart) + changed + full.slice(lineEnd);
        return {
          text,
          selStart: lineStart,
          selEnd: lineStart + changed.length,
        };
      }),
    [applyEdit],
  );

  const indentSelection = useCallback(
    (outdent: boolean) =>
      applyEdit((_selected, full, start, end) => {
        const lineStart = full.lastIndexOf("\n", start - 1) + 1;
        const lineEndIdx = full.indexOf("\n", end);
        const lineEnd = lineEndIdx === -1 ? full.length : lineEndIdx;
        const block = full.slice(lineStart, lineEnd);
        const changed = block
          .split("\n")
          .map((line) =>
            outdent
              ? line.replace(/^ {1,2}/, "")
              : line.trim()
                ? `  ${line}`
                : line,
          )
          .join("\n");
        const text = full.slice(0, lineStart) + changed + full.slice(lineEnd);
        return {
          text,
          selStart: lineStart,
          selEnd: lineStart + changed.length,
        };
      }),
    [applyEdit],
  );

  const insertLink = useCallback(() => {
    const url = prompt("Link URL:", "https://");
    if (url) wrap("[", `](${url})`, "link text");
  }, [wrap]);

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
        insertBlock(`![${alt}](local:${id})`);
        accepted++;
      }
      if (files.length > 0 && accepted === 0) {
        toast.error("Only image files can be inserted.");
      }
    },
    [insertBlock],
  );

  const insertImage = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const onImagePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length > 0) addPendingImages(files);
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
  const resolveImageUrl = (url: string) => {
    if (url.startsWith("local:")) {
      return pendingImages.current.get(url.slice(6))?.objectUrl ?? "";
    }
    return url;
  };

  // --- keyboard & clipboard behaviors ---------------------------------------

  const handleEnter = (): boolean => {
    const el = textareaRef.current;
    if (!el) return false;
    const { selectionStart: start, selectionEnd: end, value } = el;
    if (start !== end) return false;
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const line = value.slice(lineStart, start);

    const emptyLen = emptyMarkerLength(line);
    if (emptyLen > 0) {
      applyEdit((_s, full) => ({
        text: full.slice(0, lineStart) + full.slice(start),
        selStart: lineStart,
        selEnd: lineStart,
      }));
      return true;
    }

    const prefix = continueListPrefix(line);
    if (prefix) {
      applyEdit((_s, full) => {
        const insertion = `\n${prefix}`;
        return {
          text: full.slice(0, start) + insertion + full.slice(end),
          selStart: start + insertion.length,
          selEnd: start + insertion.length,
        };
      });
      return true;
    }
    return false;
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
      if (handleEnter()) e.preventDefault();
      return;
    }
    if (e.key === "Tab") {
      e.preventDefault();
      const el = textareaRef.current;
      if (!el) return;
      const hasSelection = el.selectionStart !== el.selectionEnd;
      if (hasSelection || e.shiftKey) {
        indentSelection(e.shiftKey);
      } else {
        applyEdit((_s, full, start, end) => ({
          text: `${full.slice(0, start)}  ${full.slice(end)}`,
          selStart: start + 2,
          selEnd: start + 2,
        }));
      }
      return;
    }

    const mod = e.metaKey || e.ctrlKey;
    if (!mod) return;
    const key = e.key.toLowerCase();
    // Digit keys are matched by physical position (e.code) because Shift
    // turns e.key into punctuation on most layouts.
    if (e.shiftKey) {
      if (e.code === "Digit2") {
        e.preventDefault();
        toggleHeading(2);
      } else if (e.code === "Digit3") {
        e.preventDefault();
        toggleHeading(3);
      } else if (e.code === "Digit7") {
        e.preventDefault();
        prefixLines((i) => `${i + 1}. `);
      } else if (e.code === "Digit8") {
        e.preventDefault();
        prefixLines("- ");
      } else if (e.code === "Period") {
        e.preventDefault();
        prefixLines("> ");
      } else if (key === "x") {
        e.preventDefault();
        wrap("~~", "~~", "strikethrough");
      } else if (key === "e") {
        e.preventDefault();
        wrap("```tsx\n", "\n```", "code");
      } else if (key === "i") {
        e.preventDefault();
        insertImage();
      } else if (key === "p") {
        e.preventDefault();
        setMode((m) =>
          m === "write" ? "split" : m === "split" ? "preview" : "write",
        );
      }
      return;
    }
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

  const onPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const files = Array.from(e.clipboardData?.files ?? []);
    if (files.length > 0) {
      e.preventDefault();
      addPendingImages(files);
      return;
    }
    const el = textareaRef.current;
    if (!el) return;
    const { selectionStart: start, selectionEnd: end } = el;
    const pasted = e.clipboardData?.getData("text/plain")?.trim() ?? "";
    // Pasting a URL onto selected text wraps it into a markdown link
    if (start !== end && /^https?:\/\/\S+$/.test(pasted)) {
      e.preventDefault();
      applyEdit((selected, full) => {
        const insertion = `[${selected}](${pasted})`;
        const pos = start + insertion.length;
        return {
          text: full.slice(0, start) + insertion + full.slice(end),
          selStart: pos,
          selEnd: pos,
        };
      });
    }
  };

  const onDrop = (e: React.DragEvent<HTMLTextAreaElement>) => {
    const files = Array.from(e.dataTransfer?.files ?? []);
    if (files.length === 0) return;
    e.preventDefault();
    setDragActive(false);
    addPendingImages(files);
  };

  const onDragOver = (e: React.DragEvent<HTMLTextAreaElement>) => {
    if (!e.dataTransfer?.types.includes("Files")) return;
    e.preventDefault();
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
  const onFormKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
      e.preventDefault();
      formRef.current?.requestSubmit();
    } else if (e.key === "Escape" && showShortcuts) {
      e.preventDefault();
      setShowShortcuts(false);
    }
  };

  // --- stats ---------------------------------------------------------------

  const words = content.trim() ? content.trim().split(/\s+/).length : 0;
  const characters = content.length;
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
      icon: <Strikethrough className="h-3.5 w-3.5" />,
      label: "Strikethrough (⌘⇧X)",
      action: () => wrap("~~", "~~", "strikethrough"),
    },
    {
      icon: <Heading2 className="h-3.5 w-3.5" />,
      label: "Heading (⌘⇧2 · toggles)",
      action: () => toggleHeading(2),
    },
    {
      icon: <Heading3 className="h-3.5 w-3.5" />,
      label: "Subheading (⌘⇧3 · toggles)",
      action: () => toggleHeading(3),
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
      label: "Code block (⌘⇧E · TSX)",
      action: () => wrap("```tsx\n", "\n```", "code"),
    },
    {
      icon: <Quote className="h-3.5 w-3.5" />,
      label: "Quote (⌘⇧.)",
      action: () => prefixLines("> "),
    },
    {
      icon: <List className="h-3.5 w-3.5" />,
      label: "Bullet list (⌘⇧8)",
      action: () => prefixLines("- "),
    },
    {
      icon: <ListOrdered className="h-3.5 w-3.5" />,
      label: "Numbered list (⌘⇧7)",
      action: () => prefixLines((i) => `${i + 1}. `),
    },
    {
      icon: <ListTodo className="h-3.5 w-3.5" />,
      label: "Task list",
      action: () => prefixLines("- [ ] "),
    },
    {
      icon: <ImageIcon className="h-3.5 w-3.5" />,
      label: "Image (⌘⇧I · uploads on Save)",
      action: insertImage,
    },
    {
      icon: <TableIcon className="h-3.5 w-3.5" />,
      label: "Table",
      action: () =>
        insertBlock(
          "| Column | Column | Column |\n| --- | --- | --- |\n|  |  |  |",
        ),
    },
    {
      icon: <Minus className="h-3.5 w-3.5" />,
      label: "Divider",
      action: () => insertBlock("---"),
    },
  ];

  const previewVisible = mode !== "write";

  return (
    <form ref={formRef} action={savePost} onSubmit={onSubmit} onKeyDown={onFormKeyDown}>
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
          onChange={(e) => setExcerpt(e.target.value)}
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
            <div className="relative">
              <button
                type="button"
                title="Keyboard shortcuts"
                aria-label="Keyboard shortcuts"
                aria-expanded={showShortcuts}
                onClick={() => setShowShortcuts((v) => !v)}
                className="inline-flex h-8 w-8 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <CircleHelp className="h-3.5 w-3.5" />
              </button>
              {showShortcuts && (
                <>
                  <button
                    type="button"
                    aria-label="Close shortcuts"
                    className="fixed inset-0 z-10 cursor-default"
                    onClick={() => setShowShortcuts(false)}
                  />
                  <div className="absolute right-0 top-full z-20 mt-2 max-h-96 w-72 overflow-y-auto rounded-md border border-border bg-popover p-3 shadow-md">
                    <p className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-muted-foreground">
                      Shortcuts
                    </p>
                    {shortcutGroups.map((group) => (
                      <dl key={group.group} className="mt-3 space-y-1.5">
                        <p className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-muted-foreground/70">
                          {group.group}
                        </p>
                        {group.items.map((s) => (
                          <div
                            key={s.action}
                            className="flex items-baseline justify-between gap-3 text-xs"
                          >
                            <dt className="shrink-0 font-mono text-muted-foreground">
                              {s.keys}
                            </dt>
                            <dd className="text-right text-foreground">
                              {s.action}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    ))}
                  </div>
                </>
              )}
            </div>
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
            onChange={(e) => {
              setContent(e.target.value);
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
