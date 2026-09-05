import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getBannerUrl, loadBanner, MAX_BANNER_BYTES } from "./blog-og-banner";

describe("getBannerUrl SSRF Protection", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://xyz.supabase.co");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("allows approved image hosts over https", () => {
    expect(
      getBannerUrl("https://res.cloudinary.com/demo/image/upload/sample.jpg"),
    ).toBe("https://res.cloudinary.com/demo/image/upload/sample.jpg");
    expect(
      getBannerUrl(
        "https://xyz.supabase.co/storage/v1/object/public/media/cover.png",
      ),
    ).toBe("https://xyz.supabase.co/storage/v1/object/public/media/cover.png");
  });

  it("blocks unapproved external hosts", () => {
    expect(getBannerUrl("https://evil.com/malicious.png")).toBeNull();
    expect(getBannerUrl("https://attacker.io/leak.jpg")).toBeNull();
  });

  it("blocks non-https schemes, loopback URLs, and raw IP targets", () => {
    expect(getBannerUrl("http://127.0.0.1/internal")).toBeNull();
    expect(getBannerUrl("https://169.254.169.254/latest/meta-data")).toBeNull();
    expect(getBannerUrl("http://localhost:3000/secret")).toBeNull();
    expect(getBannerUrl("file:///etc/passwd")).toBeNull();
  });

  it("handles null, undefined, or empty values", () => {
    expect(getBannerUrl(undefined)).toBeNull();
    expect(getBannerUrl("")).toBeNull();
    expect(getBannerUrl("not a url")).toBeNull();
  });
});

describe("loadBanner fetch hardening", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns null when url is null", async () => {
    expect(await loadBanner(null)).toBeNull();
  });

  it("rejects responses that are not ok", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("Not Found", {
          status: 404,
          headers: { "content-type": "image/png" },
        }),
      ),
    );

    expect(
      await loadBanner("https://res.cloudinary.com/demo/img.png"),
    ).toBeNull();
  });

  it("rejects responses with non-image content-type", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("<html></html>", {
          status: 200,
          headers: { "content-type": "text/html" },
        }),
      ),
    );

    expect(
      await loadBanner("https://res.cloudinary.com/demo/img.png"),
    ).toBeNull();
  });

  it("rejects responses with declared content-length exceeding MAX_BANNER_BYTES", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(new Uint8Array(100), {
          status: 200,
          headers: {
            "content-type": "image/png",
            "content-length": String(MAX_BANNER_BYTES + 1000),
          },
        }),
      ),
    );

    expect(
      await loadBanner("https://res.cloudinary.com/demo/img.png"),
    ).toBeNull();
  });

  it("rejects responses with actual payload exceeding MAX_BANNER_BYTES", async () => {
    const oversizedBuffer = new Uint8Array(MAX_BANNER_BYTES + 100);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(oversizedBuffer, {
          status: 200,
          headers: { "content-type": "image/png" },
        }),
      ),
    );

    expect(
      await loadBanner("https://res.cloudinary.com/demo/img.png"),
    ).toBeNull();
  });

  it("successfully returns Buffer for valid image responses", async () => {
    const sampleData = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(sampleData, {
          status: 200,
          headers: {
            "content-type": "image/png",
            "content-length": String(sampleData.byteLength),
          },
        }),
      ),
    );

    const result = await loadBanner("https://res.cloudinary.com/demo/img.png");
    expect(result).toBeInstanceOf(Buffer);
    expect(result?.length).toBe(4);
  });

  it("handles fetch errors (such as redirect:error or timeout) gracefully", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("fetch failed")),
    );

    expect(
      await loadBanner("https://res.cloudinary.com/demo/img.png"),
    ).toBeNull();
  });
});
