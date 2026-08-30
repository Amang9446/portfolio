/** Browser behaviors shared by the article editor and its regression tests. */
export function focusEditor(editor: Pick<HTMLTextAreaElement, "focus">) {
  editor.focus({ preventScroll: true });
}

/** Reveal a field before the browser tries to focus it for native validation. */
export function revealInvalidField(field: HTMLElement) {
  const details = field.closest("details") as HTMLDetailsElement | null;
  if (details) details.open = true;
}
