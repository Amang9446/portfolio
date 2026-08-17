"use client";

import { useEffect, useState } from "react";

const BACKUP_DELAY_MS = 500;

/**
 * Mirrors the editor body into localStorage so an accidental tab close does
 * not lose an unsaved draft. Keyed per post, cleared on save and on delete.
 */
export function useDraftBackup(
  draftKey: string,
  content: string,
  savedContent: string,
  restore: (draft: string) => void,
) {
  const [restored, setRestored] = useState(false);
  const [backedUpAt, setBackedUpAt] = useState<Date | null>(null);

  // Deferred a tick so it does not set state synchronously during mount.
  useEffect(() => {
    const timer = setTimeout(() => {
      const draft = localStorage.getItem(draftKey);
      if (draft && draft !== savedContent) {
        restore(draft);
        setRestored(true);
      }
    }, 0);
    return () => clearTimeout(timer);
    // Mount only: re-running would fight the author's live edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (content) {
        localStorage.setItem(draftKey, content);
        setBackedUpAt(new Date());
      }
    }, BACKUP_DELAY_MS);
    return () => clearTimeout(timer);
  }, [content, draftKey]);

  const clearDraft = () => {
    localStorage.removeItem(draftKey);
    setBackedUpAt(null);
  };

  return { restored, backedUpAt, clearDraft };
}
