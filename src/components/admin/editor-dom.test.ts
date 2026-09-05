import { describe, expect, it, vi } from "vitest";
import { focusEditor, revealInvalidField } from "./editor-dom";

describe("article editor browser behavior", () => {
  it("focuses the editor without changing the page scroll position", () => {
    const focus = vi.fn();

    focusEditor({ focus });

    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
  });

  it("opens a collapsed section containing an invalid field", () => {
    const details = { open: false };
    const field = {
      closest: vi.fn(() => details),
    } as unknown as HTMLElement;

    revealInvalidField(field);

    expect(field.closest).toHaveBeenCalledWith("details");
    expect(details.open).toBe(true);
  });
});
