import { describe, expect, it } from "vitest";
import { sanitizeHttpUrl } from "./urls";

describe("sanitizeHttpUrl", () => {
  it("allows valid https and http URLs", () => {
    expect(sanitizeHttpUrl("https://example.com")).toBe("https://example.com");
    expect(sanitizeHttpUrl("http://example.com/path?query=1#hash")).toBe(
      "http://example.com/path?query=1#hash",
    );
    expect(sanitizeHttpUrl("  https://github.com/aman  ")).toBe(
      "https://github.com/aman",
    );
  });

  it("rejects dangerous javascript: and data: schemes", () => {
    expect(sanitizeHttpUrl("javascript:alert(1)")).toBeNull();
    expect(sanitizeHttpUrl("javascript:alert(document.domain)")).toBeNull();
    expect(
      sanitizeHttpUrl(
        "data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==",
      ),
    ).toBeNull();
    expect(sanitizeHttpUrl("vbscript:msgbox(1)")).toBeNull();
    expect(sanitizeHttpUrl("file:///etc/passwd")).toBeNull();
  });

  it("rejects empty or non-string inputs", () => {
    expect(sanitizeHttpUrl("")).toBeNull();
    expect(sanitizeHttpUrl("   ")).toBeNull();
    expect(sanitizeHttpUrl(null)).toBeNull();
    expect(sanitizeHttpUrl(undefined)).toBeNull();
    expect(sanitizeHttpUrl(123)).toBeNull();
  });

  it("handles relative URLs based on allowRelative option", () => {
    expect(sanitizeHttpUrl("/images/hero.webp")).toBeNull();
    expect(sanitizeHttpUrl("/images/hero.webp", { allowRelative: true })).toBe(
      "/images/hero.webp",
    );
    expect(
      sanitizeHttpUrl("//malicious.com", { allowRelative: true }),
    ).toBeNull();
    expect(
      sanitizeHttpUrl("/\\malicious.com", { allowRelative: true }),
    ).toBeNull();
    expect(
      sanitizeHttpUrl("/path\\with\\backslash", { allowRelative: true }),
    ).toBeNull();
  });
});
