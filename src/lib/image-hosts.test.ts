import { afterEach, describe, expect, it, vi } from "vitest";
import { optimizedImageHosts, supabaseImageHost } from "./image-hosts";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("supabaseImageHost", () => {
  it("extracts the hostname from the project URL", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://abcdef.supabase.co");
    expect(supabaseImageHost()).toBe("abcdef.supabase.co");
  });

  it("is null when Supabase is not configured", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    expect(supabaseImageHost()).toBeNull();
  });

  it("is null rather than throwing on a malformed URL", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "not a url");
    expect(supabaseImageHost()).toBeNull();
  });
});

describe("optimizedImageHosts", () => {
  it("appends the Supabase host to the static CDN list", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://abcdef.supabase.co");
    expect(optimizedImageHosts()).toContain("abcdef.supabase.co");
    expect(optimizedImageHosts()).toContain("res.cloudinary.com");
  });

  it("omits it entirely when unconfigured", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    expect(
      optimizedImageHosts().some((host) => host.endsWith(".supabase.co")),
    ).toBe(false);
  });
});
