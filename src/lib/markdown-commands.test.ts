import { describe, expect, it } from "vitest";
import {
  caretPosition,
  continueListPrefix,
  continueOnEnter,
  editorStats,
  emptyMarkerLength,
  indentLines,
  insertBlock,
  linkPastedUrl,
  minimalReplacement,
  prefixLines,
  slugify,
  toggleHeading,
  wrapSelection,
  type EditorCommand,
} from "./markdown-commands";

/**
 * Apply a command to a fixture written with `|` for the caret, or `[...]`
 * around a selection, and render the result the same way. Keeps the
 * expectations readable as editor behavior rather than index arithmetic.
 */
function apply(command: EditorCommand, fixture: string) {
  let value = fixture;
  let selectionStart: number;
  let selectionEnd: number;

  const selection = value.match(/\[([\s\S]*?)\]/);
  if (selection) {
    selectionStart = selection.index!;
    selectionEnd = selectionStart + selection[1].length;
    value = value.replace(/\[([\s\S]*?)\]/, "$1");
  } else {
    selectionStart = value.indexOf("|");
    selectionEnd = selectionStart;
    value = value.replace("|", "");
  }

  const edit = command({ value, selectionStart, selectionEnd });
  if (!edit) return null;

  if (edit.selStart === edit.selEnd) {
    return (
      edit.text.slice(0, edit.selStart) + "|" + edit.text.slice(edit.selStart)
    );
  }
  return (
    edit.text.slice(0, edit.selStart) +
    "[" +
    edit.text.slice(edit.selStart, edit.selEnd) +
    "]" +
    edit.text.slice(edit.selEnd)
  );
}

describe("slugify", () => {
  it("hyphenates and lowercases", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("treats underscores as separators", () => {
    expect(slugify("my_post_title")).toBe("my-post-title");
  });

  it("trims leading and trailing hyphens", () => {
    expect(slugify("  --Draft!--  ")).toBe("draft");
  });

  it("collapses repeated separators", () => {
    expect(slugify("a   ---   b")).toBe("a-b");
  });
});

describe("continueListPrefix", () => {
  it("repeats a bullet marker", () => {
    expect(continueListPrefix("- item")).toBe("- ");
  });

  it("preserves indentation", () => {
    expect(continueListPrefix("    * nested")).toBe("    * ");
  });

  it("advances an ordered list", () => {
    expect(continueListPrefix("3. third")).toBe("4. ");
    expect(continueListPrefix("  9. ninth")).toBe("  10. ");
  });

  it("resets a checked task to unchecked", () => {
    expect(continueListPrefix("- [x] done")).toBe("- [ ] ");
    expect(continueListPrefix("2. [ ] todo")).toBe("2. [ ] ");
  });

  it("repeats quote markers including nesting", () => {
    expect(continueListPrefix("> quoted")).toBe("> ");
    expect(continueListPrefix(">> deep")).toBe(">> ");
  });

  it("returns null for ordinary prose", () => {
    expect(continueListPrefix("just a line")).toBeNull();
    expect(continueListPrefix("")).toBeNull();
  });

  it("does not treat a bare dash without a space as a list", () => {
    expect(continueListPrefix("-nope")).toBeNull();
  });
});

describe("emptyMarkerLength", () => {
  it("measures an empty bullet", () => {
    expect(emptyMarkerLength("- ")).toBe(2);
    expect(emptyMarkerLength("  - ")).toBe(4);
  });

  it("measures an empty ordered item", () => {
    expect(emptyMarkerLength("1. ")).toBe(3);
  });

  it("measures an empty task item", () => {
    expect(emptyMarkerLength("- [ ] ")).toBe(6);
  });

  it("measures an empty quote", () => {
    expect(emptyMarkerLength("> ")).toBe(2);
  });

  it("returns 0 when the item has content", () => {
    expect(emptyMarkerLength("- item")).toBe(0);
    expect(emptyMarkerLength("1. one")).toBe(0);
  });
});

describe("wrapSelection", () => {
  it("wraps the selection and keeps it selected", () => {
    expect(apply(wrapSelection("**", "**", "bold"), "make [this] bold")).toBe(
      "make **[this]** bold",
    );
  });

  it("inserts the placeholder when nothing is selected", () => {
    expect(apply(wrapSelection("**", "**", "bold"), "empty |")).toBe(
      "empty **[bold]**",
    );
  });
});

describe("prefixLines", () => {
  it("prefixes every line in the selection", () => {
    expect(apply(prefixLines("> "), "[one\ntwo]")).toBe("[> one\n> two]");
  });

  it("expands a caret to the whole line", () => {
    expect(apply(prefixLines("- "), "on|e")).toBe("[- one]");
  });

  it("numbers an ordered list from the selection start", () => {
    expect(
      apply(
        prefixLines((i) => `${i + 1}. `),
        "[a\nb\nc]",
      ),
    ).toBe("[1. a\n2. b\n3. c]");
  });
});

describe("toggleHeading", () => {
  it("adds the heading prefix", () => {
    expect(apply(toggleHeading(2), "Titl|e")).toBe("[## Title]");
  });

  it("removes it when every line is already at that level", () => {
    expect(apply(toggleHeading(2), "[## a\n## b]")).toBe("[a\nb]");
  });

  it("replaces a different heading level instead of stacking", () => {
    expect(apply(toggleHeading(3), "## |x")).toBe("[### x]");
    expect(apply(toggleHeading(2), "#### |x")).toBe("[## x]");
  });

  it("strips the prefix when the line is already at that level", () => {
    expect(apply(toggleHeading(3), "### |x")).toBe("[x]");
  });

  it("leaves blank lines alone", () => {
    expect(apply(toggleHeading(2), "[a\n\nb]")).toBe("[## a\n\n## b]");
  });
});

describe("indentLines", () => {
  it("indents by two spaces", () => {
    expect(apply(indentLines(false), "[a\nb]")).toBe("[  a\n  b]");
  });

  it("outdents up to two spaces", () => {
    expect(apply(indentLines(true), "[  a\n b]")).toBe("[a\nb]");
  });

  it("does not indent blank lines", () => {
    expect(apply(indentLines(false), "[a\n\nb]")).toBe("[  a\n\n  b]");
  });
});

describe("insertBlock", () => {
  it("opens a new block when the caret is mid-line", () => {
    expect(apply(insertBlock("---"), "text|")).toBe("text\n\n---\n|");
  });

  it("does not add a leading blank line at the start of the document", () => {
    expect(apply(insertBlock("---"), "|")).toBe("---\n|");
  });

  it("does not add one directly after a newline", () => {
    expect(apply(insertBlock("---"), "text\n|")).toBe("text\n---\n|");
  });
});

describe("continueOnEnter", () => {
  it("continues a bullet list", () => {
    expect(apply(continueOnEnter(), "- one|")).toBe("- one\n- |");
  });

  it("advances an ordered list", () => {
    expect(apply(continueOnEnter(), "1. one|")).toBe("1. one\n2. |");
  });

  it("clears an empty marker instead of continuing", () => {
    expect(apply(continueOnEnter(), "- one\n- |")).toBe("- one\n|");
  });

  it("declines on ordinary prose so the browser inserts the newline", () => {
    expect(apply(continueOnEnter(), "prose|")).toBeNull();
  });

  it("declines when there is a selection", () => {
    expect(apply(continueOnEnter(), "- [one]")).toBeNull();
  });
});

describe("linkPastedUrl", () => {
  it("wraps the selection in a markdown link", () => {
    expect(apply(linkPastedUrl("https://example.com"), "see [docs] here")).toBe(
      "see [docs](https://example.com)| here",
    );
  });

  it("trims surrounding whitespace from the pasted URL", () => {
    expect(apply(linkPastedUrl("  https://example.com \n"), "[x]")).toBe(
      "[x](https://example.com)|",
    );
  });

  it("declines when nothing is selected", () => {
    expect(apply(linkPastedUrl("https://example.com"), "caret |")).toBeNull();
  });

  it("declines for non-URL text", () => {
    expect(apply(linkPastedUrl("just words"), "[x]")).toBeNull();
  });

  it("declines for a URL containing whitespace", () => {
    expect(
      apply(linkPastedUrl("https://a.com https://b.com"), "[x]"),
    ).toBeNull();
  });
});

describe("minimalReplacement", () => {
  it("narrows to the changed span", () => {
    expect(minimalReplacement("hello world", "hello brave world")).toEqual({
      start: 6,
      end: 6,
      replacement: "brave ",
    });
  });

  it("describes a deletion as an empty replacement", () => {
    expect(minimalReplacement("- ", "")).toEqual({
      start: 0,
      end: 2,
      replacement: "",
    });
  });

  it("handles a pure append", () => {
    expect(minimalReplacement("ab", "abc")).toEqual({
      start: 2,
      end: 2,
      replacement: "c",
    });
  });
});

describe("caretPosition", () => {
  it("is 1-based on the first line", () => {
    expect(caretPosition("hello", 0)).toEqual({ line: 1, col: 1 });
    expect(caretPosition("hello", 3)).toEqual({ line: 1, col: 4 });
  });

  it("counts lines and restarts the column", () => {
    expect(caretPosition("ab\ncd", 4)).toEqual({ line: 2, col: 2 });
  });
});

describe("editorStats", () => {
  it("counts words and characters", () => {
    expect(editorStats("one two three")).toEqual({
      words: 3,
      characters: 13,
      minutes: 1,
    });
  });

  it("reports zero words but never zero minutes for empty content", () => {
    expect(editorStats("   ")).toMatchObject({ words: 0, minutes: 1 });
  });

  it("scales reading time with length", () => {
    expect(editorStats("word ".repeat(600)).minutes).toBe(3);
  });
});
