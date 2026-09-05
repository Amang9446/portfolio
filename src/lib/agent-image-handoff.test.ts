import { describe, expect, it } from "vitest";
import {
  AGENT_IMAGE_REQUEST_KIND,
  buildAgentImageHandoff,
  buildAgentImageObjectPath,
  encodeAgentImageRequest,
  parseAgentImageHandoff,
  parseAgentImageRequest,
} from "./agent-image-handoff.mjs";

const now = Date.parse("2026-08-30T08:00:00.000Z");
const projectUrl = "https://nasejsbkkaonqcfkxljf.supabase.co";
const requestId = "152e2ba7-3caf-4726-9cf7-c80432869988";
const fileId = "9b783243-47da-4805-8ea8-561c91e54b58";

function request(overrides = {}) {
  return {
    kind: AGENT_IMAGE_REQUEST_KIND,
    version: 1 as const,
    requestId,
    createdAt: "2026-08-30T07:55:00.000Z",
    files: [
      {
        id: fileId,
        name: "QR Anatomy.webp",
        contentType: "image/webp",
        size: 92_788,
        sha256: "a".repeat(64),
      },
    ],
    ...overrides,
  };
}

function approvedHandoff() {
  const requestCode = encodeAgentImageRequest(request(), now);
  const objectPath = buildAgentImageObjectPath(
    "how-qr-codes-work",
    requestId,
    request().files[0],
  );
  return buildAgentImageHandoff(
    requestCode,
    projectUrl,
    [
      {
        fileId,
        objectPath,
        signedUrl: `${projectUrl}/storage/v1/object/upload/sign/media/${objectPath}?token=short-lived-token`,
      },
    ],
    now,
  );
}

describe("agent image request", () => {
  it("round-trips only reviewed file metadata", () => {
    const code = encodeAgentImageRequest(request(), now);
    const parsed = parseAgentImageRequest(code, now);

    expect(code).toMatch(/^portfolio-image-request:v1:/);
    expect(code).not.toContain("/Users/");
    expect(parsed.files).toEqual(request().files);
  });

  it("rejects active and mismatched file types", () => {
    expect(() =>
      encodeAgentImageRequest(
        request({
          files: [
            {
              ...request().files[0],
              name: "payload.svg",
              contentType: "image/svg+xml",
            },
          ],
        }),
        now,
      ),
    ).toThrow("unsupported image type");

    expect(() =>
      encodeAgentImageRequest(
        request({ files: [{ ...request().files[0], name: "photo.png" }] }),
        now,
      ),
    ).toThrow("unsupported image type");
  });

  it("rejects stale request codes", () => {
    const code = encodeAgentImageRequest(request(), now);
    expect(() =>
      parseAgentImageRequest(code, now + 25 * 60 * 60 * 1000),
    ).toThrow("older than 24 hours");
  });

  it("creates an immutable path under the current draft slug", () => {
    expect(
      buildAgentImageObjectPath(
        "how-qr-codes-work",
        requestId,
        request().files[0],
      ),
    ).toBe(
      `posts/how-qr-codes-work/agent-${requestId}-${fileId}-qr-anatomy.webp`,
    );
  });
});

describe("agent image handoff", () => {
  it("round-trips an exact-path Supabase handoff", () => {
    const handoff = approvedHandoff();
    const parsed = parseAgentImageHandoff(JSON.stringify(handoff), now);

    expect(parsed.files[0].objectPath).toContain(
      "posts/how-qr-codes-work/agent-",
    );
    expect(parsed.files[0].publicUrl).toBe(
      `${projectUrl}/storage/v1/object/public/media/${parsed.files[0].objectPath}`,
    );
    expect(Date.parse(parsed.expiresAt) - now).toBe(115 * 60 * 1000);
  });

  it("rejects a signed URL on another origin", () => {
    const handoff = approvedHandoff();
    handoff.files[0].signedUrl = handoff.files[0].signedUrl.replace(
      projectUrl,
      "https://attacker.example",
    );

    expect(() => parseAgentImageHandoff(handoff, now)).toThrow(
      "not scoped to the expected Supabase path",
    );
  });

  it("rejects path and public URL tampering", () => {
    const wrongPath = approvedHandoff();
    wrongPath.files[0].objectPath = "posts/someone-else/payload.webp";
    expect(() => parseAgentImageHandoff(wrongPath, now)).toThrow(
      "does not match its approved file",
    );

    const wrongPublicUrl = approvedHandoff();
    wrongPublicUrl.files[0].publicUrl = "https://attacker.example/image.webp";
    expect(() => parseAgentImageHandoff(wrongPublicUrl, now)).toThrow(
      "public URL does not match",
    );
  });
});
