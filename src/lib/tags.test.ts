import { describe, expect, it } from "vitest";
import {
  MAX_TAGS_PER_POST,
  normalizeTags,
  parseTagsField,
  tagSlug,
} from "./tags";

describe("tagSlug", () => {
  it("lowercases and hyphenates", () => {
    expect(tagSlug("React Native")).toBe("react-native");
  });

  it("strips punctuation rather than encoding it", () => {
    expect(tagSlug("C++ & Rust!")).toBe("c-rust");
  });

  it("collapses runs of spaces and hyphens into one hyphen", () => {
    expect(tagSlug("web   --  dev")).toBe("web-dev");
  });

  it("folds accents through NFKD normalization", () => {
    expect(tagSlug("Café")).toBe("cafe");
  });

  it("returns an empty string when nothing survives", () => {
    expect(tagSlug("!!!")).toBe("");
    expect(tagSlug("   ")).toBe("");
  });
});

describe("normalizeTags", () => {
  it("trims and collapses internal whitespace", () => {
    expect(normalizeTags(["  react   native  "])).toEqual(["react native"]);
  });

  it("drops entries that slug to nothing", () => {
    expect(normalizeTags(["ok", "!!!", "  "])).toEqual(["ok"]);
  });

  it("de-duplicates by slug, keeping the first spelling", () => {
    expect(
      normalizeTags(["React Native", "react native", "REACT-NATIVE"]),
    ).toEqual(["React Native"]);
  });

  it("caps the tag count", () => {
    const many = Array.from(
      { length: MAX_TAGS_PER_POST + 4 },
      (_, i) => `tag${i}`,
    );
    expect(normalizeTags(many)).toHaveLength(MAX_TAGS_PER_POST);
  });

  it("truncates an over-long tag before slugging it", () => {
    const [tag] = normalizeTags(["x".repeat(64)]);
    expect(tag).toHaveLength(32);
  });
});

describe("parseTagsField", () => {
  it("splits the comma-separated admin field", () => {
    expect(parseTagsField("React, Expo , TypeScript")).toEqual([
      "React",
      "Expo",
      "TypeScript",
    ]);
  });

  it("returns an empty list for an empty field", () => {
    expect(parseTagsField("")).toEqual([]);
    expect(parseTagsField("  ,  ,")).toEqual([]);
  });
});
