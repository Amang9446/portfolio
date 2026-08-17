"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  caretPosition,
  minimalReplacement,
  type EditorCommand,
} from "@/lib/markdown-commands";

interface UseMarkdownEditorOptions {
  content: string;
  setContent: (value: string) => void;
  /** False while the preview-only mode hides the textarea. */
  visible: boolean;
}

/**
 * Owns the editor textarea: applies commands from `lib/markdown-commands`,
 * keeps the caret readout current, and grows the box with the article.
 *
 * Commands are applied through `document.execCommand("insertText")` so they
 * join the browser's native undo stack — Cmd-Z keeps working after a toolbar
 * click. Where execCommand is unavailable the state update is applied directly
 * and only undo history is lost.
 */
export function useMarkdownEditor({
  content,
  setContent,
  visible,
}: UseMarkdownEditorOptions) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [cursor, setCursor] = useState({ line: 1, col: 1 });

  const updateCursor = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    setCursor(caretPosition(el.value, el.selectionStart));
  }, []);

  // The textarea grows with the article instead of scrolling internally.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el || !visible) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [content, visible]);

  /**
   * Run a command against the live textarea. Returns false when the command
   * declined (so the caller can let the keystroke through).
   */
  const run = useCallback(
    (command: EditorCommand) => {
      const el = textareaRef.current;
      if (!el) return false;

      const edit = command({
        value: el.value,
        selectionStart: el.selectionStart,
        selectionEnd: el.selectionEnd,
      });
      if (!edit || edit.text === el.value) return false;

      const { start, end, replacement } = minimalReplacement(
        el.value,
        edit.text,
      );

      el.focus();
      el.setSelectionRange(start, end);

      let inserted = false;
      try {
        inserted = document.execCommand("insertText", false, replacement);
      } catch {
        inserted = false;
      }
      if (!inserted) setContent(edit.text);

      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(edit.selStart, edit.selEnd);
        updateCursor();
      });

      return true;
    },
    [setContent, updateCursor],
  );

  return { textareaRef, cursor, updateCursor, run };
}
