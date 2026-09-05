import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

vi.mock("@/lib/supabase/public", () => ({
  createPublicClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockResolvedValue({ error: null }),
    })),
  })),
}));

vi.mock("@/lib/supabase/config", () => ({
  isSupabaseConfigured: vi.fn(() => true),
}));

describe("GET /api/ping", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("allows requests when CRON_SECRET is not set", async () => {
    const request = new Request("http://localhost:3000/api/ping");
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
  });

  it("rejects requests without authorization header when CRON_SECRET is set", async () => {
    vi.stubEnv("CRON_SECRET", "super-secret-cron-token");

    const request = new Request("http://localhost:3000/api/ping");
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.ok).toBe(false);
    expect(body.reason).toBe("unauthorized");
  });

  it("rejects requests with wrong bearer token when CRON_SECRET is set", async () => {
    vi.stubEnv("CRON_SECRET", "super-secret-cron-token");

    const request = new Request("http://localhost:3000/api/ping", {
      headers: { authorization: "Bearer wrong-token" },
    });
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.ok).toBe(false);
    expect(body.reason).toBe("unauthorized");
  });

  it("accepts requests with valid bearer token when CRON_SECRET is set", async () => {
    vi.stubEnv("CRON_SECRET", "super-secret-cron-token");

    const request = new Request("http://localhost:3000/api/ping", {
      headers: { authorization: "Bearer super-secret-cron-token" },
    });
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
  });
});
