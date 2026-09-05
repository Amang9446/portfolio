/**
 * Pure text transforms behind the admin markdown editor.
 *
 * Every command takes an immutable snapshot of the textarea and returns the
 * next value plus where the selection should land — no DOM, no React. The
 * editor hook (`use-markdown-editor.ts`) is the only thing that knows about
 * textareas, which keeps this file directly unit-testable.
 */

export interface EditorSelection {
  value: string;
  selectionStart: number;
  selectionEnd: number;
}

export interface EditorEdit {
  text: string;
  selStart: number;
  selEnd: number;
}

/** Commands return null when the keystroke should fall through untouched. */
export type EditorCommand = (state: EditorSelection) => EditorEdit | null;

/**
 * URL-safe slug for post slugs and upload filenames.
 *
 * Underscores survive the strip pass so the separator pass below can turn them
 * into hyphens — stripping them first would silently run words together
 * (`my_post_title` -> `myposttitle`).
 */
export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s_-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// ---------------------------------------------------------------------------
// List / quote continuation
// ---------------------------------------------------------------------------

/**
 * The marker to repeat when Enter is pressed at the end of `line`, or null if
 * the line does not start a list, task list, or quote. Ordered lists advance.
 */
export function continueListPrefix(line: string): string | null {
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

/**
 * Length of the marker when `line` is an "empty" item — a marker with no
 * content. Enter on one of those exits the list instead of continuing it.
 * Returns 0 when the line is not an empty marker.
 */
export function emptyMarkerLength(line: string): number {
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

// ---------------------------------------------------------------------------
// Selection helpers
// ---------------------------------------------------------------------------

/** Expand a selection to cover whole lines. */
function lineBounds(value: string, start: number, end: number) {
  const lineStart = value.lastIndexOf("\n", start - 1) + 1;
  const lineEndIndex = value.indexOf("\n", end);
  return {
    lineStart,
    lineEnd: lineEndIndex === -1 ? value.length : lineEndIndex,
  };
}

/** Replace the whole-line block under the selection with `next`. */
function replaceBlock(
  value: string,
  lineStart: number,
  lineEnd: number,
  next: string,
): EditorEdit {
  return {
    text: value.slice(0, lineStart) + next + value.slice(lineEnd),
    selStart: lineStart,
    selEnd: lineStart + next.length,
  };
}

/**
 * The smallest replacement that turns `before` into `after`, as a range in
 * `before` plus the text to insert.
 *
 * The editor feeds this to `document.execCommand("insertText")` so toolbar
 * edits join the browser's native undo stack instead of resetting it.
 */
export function minimalReplacement(before: string, after: string) {
  let prefix = 0;
  const maxPrefix = Math.min(before.length, after.length);
  while (prefix < maxPrefix && before[prefix] === after[prefix]) prefix++;

  let suffix = 0;
  const maxSuffix = Math.min(before.length - prefix, after.length - prefix);
  while (
    suffix < maxSuffix &&
    before[before.length - 1 - suffix] === after[after.length - 1 - suffix]
  ) {
    suffix++;
  }

  return {
    start: prefix,
    end: before.length - suffix,
    replacement: after.slice(prefix, after.length - suffix),
  };
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

/** Wrap the selection (or `placeholder`) in `before`/`after` delimiters. */
export function wrapSelection(
  before: string,
  after: string,
  placeholder: string,
): EditorCommand {
  return ({ value, selectionStart, selectionEnd }) => {
    const body = value.slice(selectionStart, selectionEnd) || placeholder;
    return {
      text:
        value.slice(0, selectionStart) +
        before +
        body +
        after +
        value.slice(selectionEnd),
      selStart: selectionStart + before.length,
      selEnd: selectionStart + before.length + body.length,
    };
  };
}

/**
 * Prefix every selected line. `prefix` may be a function of the line's index
 * within the selection, which is what makes ordered lists count up.
 */
export function prefixLines(
  prefix: string | ((index: number) => string),
): EditorCommand {
  return ({ value, selectionStart, selectionEnd }) => {
    const { lineStart, lineEnd } = lineBounds(
      value,
      selectionStart,
      selectionEnd,
    );
    const next = value
      .slice(lineStart, lineEnd)
      .split("\n")
      .map(
        (line, index) =>
          (typeof prefix === "function" ? prefix(index) : prefix) + line,
      )
      .join("\n");

    return replaceBlock(value, lineStart, lineEnd, next);
  };
}

/**
 * Set the selected lines to `## `/`### `, replacing any existing heading level.
 * Running it again on lines already at that level strips the prefix, so the
 * shortcut cycles text -> heading -> text instead of stacking `## ## `.
 */
export function toggleHeading(level: 2 | 3): EditorCommand {
  return ({ value, selectionStart, selectionEnd }) => {
    const { lineStart, lineEnd } = lineBounds(
      value,
      selectionStart,
      selectionEnd,
    );
    const prefix = `${"#".repeat(level)} `;
    const strip = (line: string) => line.replace(/^#{1,6}\s+/, "");
    const lines = value.slice(lineStart, lineEnd).split("\n");
    const allAtLevel = lines
      .filter((line) => line.trim())
      .every((line) => line.startsWith(prefix));

    const next = lines
      .map((line) => {
        if (!line.trim()) return line;
        return allAtLevel ? strip(line) : prefix + strip(line);
      })
      .join("\n");

    return replaceBlock(value, lineStart, lineEnd, next);
  };
}

/** Indent or outdent the selected lines by two spaces. */
export function indentLines(outdent: boolean): EditorCommand {
  return ({ value, selectionStart, selectionEnd }) => {
    const { lineStart, lineEnd } = lineBounds(
      value,
      selectionStart,
      selectionEnd,
    );
    const next = value
      .slice(lineStart, lineEnd)
      .split("\n")
      .map((line) =>
        outdent
          ? line.replace(/^ {1,2}/, "")
          : line.trim()
            ? `  ${line}`
            : line,
      )
      .join("\n");

    return replaceBlock(value, lineStart, lineEnd, next);
  };
}

/** Insert two spaces at the caret (Tab with no selection). */
export function insertTab(): EditorCommand {
  return ({ value, selectionStart, selectionEnd }) => ({
    text: `${value.slice(0, selectionStart)}  ${value.slice(selectionEnd)}`,
    selStart: selectionStart + 2,
    selEnd: selectionStart + 2,
  });
}

/** Drop a block (table, divider, image) onto its own line at the caret. */
export function insertBlock(block: string): EditorCommand {
  return ({ value, selectionStart, selectionEnd }) => {
    const needsNewline =
      selectionStart > 0 && value[selectionStart - 1] !== "\n";
    const insertion = (needsNewline ? "\n\n" : "") + block + "\n";
    const position = selectionStart + insertion.length;

    return {
      text:
        value.slice(0, selectionStart) + insertion + value.slice(selectionEnd),
      selStart: position,
      selEnd: position,
    };
  };
}

/**
 * Enter inside a list or quote: continue the marker, or clear it when the
 * current item is empty. Returns null when the default newline should apply.
 */
export function continueOnEnter(): EditorCommand {
  return ({ value, selectionStart, selectionEnd }) => {
    if (selectionStart !== selectionEnd) return null;

    const lineStart = value.lastIndexOf("\n", selectionStart - 1) + 1;
    const line = value.slice(lineStart, selectionStart);

    if (emptyMarkerLength(line) > 0) {
      return {
        text: value.slice(0, lineStart) + value.slice(selectionStart),
        selStart: lineStart,
        selEnd: lineStart,
      };
    }

    const prefix = continueListPrefix(line);
    if (!prefix) return null;

    const insertion = `\n${prefix}`;
    return {
      text:
        value.slice(0, selectionStart) + insertion + value.slice(selectionEnd),
      selStart: selectionStart + insertion.length,
      selEnd: selectionStart + insertion.length,
    };
  };
}

const URL_PATTERN = /^https?:\/\/\S+$/;

/**
 * Pasting a bare URL over selected text turns it into a markdown link.
 * Returns null for anything else, so normal pastes are left to the browser.
 */
export function linkPastedUrl(pasted: string): EditorCommand {
  return ({ value, selectionStart, selectionEnd }) => {
    const url = pasted.trim();
    if (selectionStart === selectionEnd || !URL_PATTERN.test(url)) return null;

    const insertion = `[${value.slice(selectionStart, selectionEnd)}](${url})`;
    const position = selectionStart + insertion.length;

    return {
      text:
        value.slice(0, selectionStart) + insertion + value.slice(selectionEnd),
      selStart: position,
      selEnd: position,
    };
  };
}

/** 1-based caret position, for the editor's status line. */
export function caretPosition(value: string, caret: number) {
  const before = value.slice(0, caret);
  return {
    line: before.split("\n").length,
    col: caret - before.lastIndexOf("\n"),
  };
}

/** Word/character/reading-time counts shown under the editor. */
export function editorStats(content: string) {
  const words = content.trim() ? content.trim().split(/\s+/).length : 0;

  return {
    words,
    characters: content.length,
    minutes: Math.max(1, Math.round(words / 200)),
  };
}
