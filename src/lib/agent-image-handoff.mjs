/**
 * Data-only handoff between a local agent and the authenticated post editor.
 *
 * The request contains no secret. The response contains Supabase's short-lived,
 * exact-path upload URLs and must be treated as a temporary credential.
 */

export const AGENT_IMAGE_REQUEST_KIND = "portfolio-agent-image-request";
export const AGENT_IMAGE_HANDOFF_KIND = "portfolio-agent-image-handoff";
export const AGENT_IMAGE_REQUEST_PREFIX = "portfolio-image-request:v1:";
export const MAX_AGENT_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_AGENT_IMAGE_FILES = 12;
export const MAX_AGENT_IMAGE_TOTAL_BYTES = 40 * 1024 * 1024;

const REQUEST_MAX_AGE_MS = 24 * 60 * 60 * 1000;
// Supabase's signed upload URLs last two hours. Ending the local handoff five
// minutes early avoids presenting a token as usable at the expiry boundary.
const HANDOFF_LIFETIME_MS = 115 * 60 * 1000;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const EXTENSION_BY_MIME = new Map([
  ["image/avif", ["avif"]],
  ["image/gif", ["gif"]],
  ["image/jpeg", ["jpg", "jpeg"]],
  ["image/png", ["png"]],
  ["image/webp", ["webp"]],
]);

/** @typedef {{ id: string, name: string, contentType: string, size: number, sha256: string }} AgentImageFile */
/** @typedef {{ kind: string, version: 1, requestId: string, createdAt: string, files: AgentImageFile[] }} AgentImageRequest */
/** @typedef {{ fileId: string, objectPath: string, signedUrl: string }} AgentImageSignedSlot */
/** @typedef {AgentImageFile & { objectPath: string, signedUrl: string, publicUrl: string }} AgentImageHandoffFile */
/** @typedef {{ kind: string, version: 1, requestId: string, projectUrl: string, bucket: "media", createdAt: string, expiresAt: string, files: AgentImageHandoffFile[] }} AgentImageHandoff */

function assertRecord(value, message) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(message);
  }
  return value;
}

function encodeBase64Url(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  }
  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");
}

function decodeBase64Url(value) {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) {
    throw new Error("The agent upload request code is malformed.");
  }
  const padded = value.replaceAll("-", "+").replaceAll("_", "/");
  const binary = atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function normalizeTimestamp(value, label) {
  if (typeof value !== "string" || !Number.isFinite(Date.parse(value))) {
    throw new Error(`${label} is invalid.`);
  }
  return new Date(value).toISOString();
}

function normalizeFile(value) {
  const file = assertRecord(value, "An agent image entry is invalid.");
  if (typeof file.id !== "string" || !UUID_PATTERN.test(file.id)) {
    throw new Error("An agent image id is invalid.");
  }
  if (
    typeof file.name !== "string" ||
    file.name.length < 1 ||
    file.name.length > 120 ||
    file.name !== file.name.trim() ||
    /[\\/\0]/.test(file.name)
  ) {
    throw new Error("An agent image filename is invalid.");
  }
  const extensions = EXTENSION_BY_MIME.get(file.contentType);
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (!extensions || !extension || !extensions.includes(extension)) {
    throw new Error(`\"${file.name}\" has an unsupported image type.`);
  }
  if (
    !Number.isSafeInteger(file.size) ||
    file.size < 1 ||
    file.size > MAX_AGENT_IMAGE_BYTES
  ) {
    throw new Error(`\"${file.name}\" must be between 1 byte and 10 MiB.`);
  }
  if (typeof file.sha256 !== "string" || !SHA256_PATTERN.test(file.sha256)) {
    throw new Error(`\"${file.name}\" has an invalid SHA-256 hash.`);
  }
  return {
    id: file.id.toLowerCase(),
    name: file.name,
    contentType: file.contentType,
    size: file.size,
    sha256: file.sha256,
  };
}

function normalizeRequest(value, nowMs) {
  const request = assertRecord(value, "The agent upload request is invalid.");
  if (
    request.kind !== AGENT_IMAGE_REQUEST_KIND ||
    request.version !== 1 ||
    typeof request.requestId !== "string" ||
    !UUID_PATTERN.test(request.requestId)
  ) {
    throw new Error("The agent upload request format is unsupported.");
  }
  const createdAt = normalizeTimestamp(request.createdAt, "Request timestamp");
  const createdAtMs = Date.parse(createdAt);
  if (createdAtMs > nowMs + 5 * 60 * 1000) {
    throw new Error("The agent upload request comes from the future.");
  }
  if (createdAtMs < nowMs - REQUEST_MAX_AGE_MS) {
    throw new Error("The agent upload request is older than 24 hours.");
  }
  if (
    !Array.isArray(request.files) ||
    request.files.length < 1 ||
    request.files.length > MAX_AGENT_IMAGE_FILES
  ) {
    throw new Error(
      `An upload request must contain 1–${MAX_AGENT_IMAGE_FILES} images.`,
    );
  }
  const files = request.files.map(normalizeFile);
  if (new Set(files.map((file) => file.id)).size !== files.length) {
    throw new Error("The agent upload request contains duplicate file ids.");
  }
  const totalBytes = files.reduce((total, file) => total + file.size, 0);
  if (totalBytes > MAX_AGENT_IMAGE_TOTAL_BYTES) {
    throw new Error("An upload request cannot exceed 40 MiB in total.");
  }
  return {
    kind: AGENT_IMAGE_REQUEST_KIND,
    version: 1,
    requestId: request.requestId.toLowerCase(),
    createdAt,
    files,
  };
}

/** @param {AgentImageRequest} request */
export function encodeAgentImageRequest(request, nowMs = Date.now()) {
  const normalized = normalizeRequest(request, nowMs);
  return (
    AGENT_IMAGE_REQUEST_PREFIX + encodeBase64Url(JSON.stringify(normalized))
  );
}

/** @returns {AgentImageRequest} */
export function parseAgentImageRequest(code, nowMs = Date.now()) {
  if (typeof code !== "string") {
    throw new Error("Paste the agent upload request code.");
  }
  const compact = code.trim();
  if (
    !compact.startsWith(AGENT_IMAGE_REQUEST_PREFIX) ||
    compact.length > 65536
  ) {
    throw new Error("The agent upload request code is malformed.");
  }
  try {
    return normalizeRequest(
      JSON.parse(
        decodeBase64Url(compact.slice(AGENT_IMAGE_REQUEST_PREFIX.length)),
      ),
      nowMs,
    );
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error("The agent upload request code is malformed.");
    }
    throw error;
  }
}

function safeFileStem(name) {
  const extensionIndex = name.lastIndexOf(".");
  const stem = (extensionIndex > 0 ? name.slice(0, extensionIndex) : name)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s_-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return stem || "image";
}

/** @param {AgentImageFile} file */
export function buildAgentImageObjectPath(slug, requestId, file) {
  if (typeof slug !== "string" || !SLUG_PATTERN.test(slug)) {
    throw new Error(
      "Save the draft with a valid slug before approving uploads.",
    );
  }
  if (!UUID_PATTERN.test(requestId)) {
    throw new Error("The agent upload request id is invalid.");
  }
  const normalized = normalizeFile(file);
  const extension = normalized.name.split(".").pop().toLowerCase();
  return `posts/${slug}/agent-${requestId.toLowerCase()}-${normalized.id}-${safeFileStem(normalized.name)}.${extension}`;
}

function normalizeProjectUrl(value) {
  if (typeof value !== "string")
    throw new Error("The Supabase project URL is missing.");
  const url = new URL(value);
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  const hosted =
    url.protocol === "https:" &&
    (url.hostname.endsWith(".supabase.co") ||
      url.hostname.endsWith(".supabase.in"));
  if (
    (!local && !hosted) ||
    (local && !["http:", "https:"].includes(url.protocol))
  ) {
    throw new Error("The Supabase project URL is not trusted.");
  }
  if (
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== "/"
  ) {
    throw new Error("The Supabase project URL is invalid.");
  }
  return url.origin;
}

function publicUrlFor(projectUrl, objectPath) {
  return `${projectUrl}/storage/v1/object/public/media/${objectPath}`;
}

function validateSignedUrl(projectUrl, objectPath, value) {
  if (typeof value !== "string")
    throw new Error("A signed upload URL is missing.");
  const url = new URL(value);
  const expectedPath = `/storage/v1/object/upload/sign/media/${objectPath}`;
  if (
    url.origin !== projectUrl ||
    url.pathname !== expectedPath ||
    !url.searchParams.get("token")
  ) {
    throw new Error(
      "A signed upload URL is not scoped to the expected Supabase path.",
    );
  }
  return url.toString();
}

/**
 * Joins an already-reviewed request to the slots Supabase issued for it.
 * @param {string} requestCode
 * @param {string} projectUrl
 * @param {AgentImageSignedSlot[]} slots
 * @returns {AgentImageHandoff}
 */
export function buildAgentImageHandoff(
  requestCode,
  projectUrl,
  slots,
  nowMs = Date.now(),
) {
  const request = parseAgentImageRequest(requestCode, nowMs);
  const trustedProjectUrl = normalizeProjectUrl(projectUrl);
  if (!Array.isArray(slots) || slots.length !== request.files.length) {
    throw new Error("Supabase did not issue every requested upload slot.");
  }
  const slotsByFile = new Map(slots.map((slot) => [slot.fileId, slot]));
  if (slotsByFile.size !== slots.length) {
    throw new Error("Supabase returned duplicate upload slots.");
  }

  const files = request.files.map((file) => {
    const slot = slotsByFile.get(file.id);
    const expectedPath = buildAgentImageObjectPath(
      "placeholder",
      request.requestId,
      file,
    ).replace("posts/placeholder/", "");
    if (!slot || typeof slot.objectPath !== "string") {
      throw new Error(`Supabase did not issue a slot for \"${file.name}\".`);
    }
    const objectPathSuffix = slot.objectPath.replace(
      /^posts\/[a-z0-9-]+\//,
      "",
    );
    if (objectPathSuffix !== expectedPath) {
      throw new Error("An upload slot does not match the approved request.");
    }
    return {
      ...file,
      objectPath: slot.objectPath,
      signedUrl: validateSignedUrl(
        trustedProjectUrl,
        slot.objectPath,
        slot.signedUrl,
      ),
      publicUrl: publicUrlFor(trustedProjectUrl, slot.objectPath),
    };
  });

  return {
    kind: AGENT_IMAGE_HANDOFF_KIND,
    version: 1,
    requestId: request.requestId,
    projectUrl: trustedProjectUrl,
    bucket: "media",
    createdAt: new Date(nowMs).toISOString(),
    expiresAt: new Date(nowMs + HANDOFF_LIFETIME_MS).toISOString(),
    files,
  };
}

/** @returns {AgentImageHandoff} */
export function parseAgentImageHandoff(value, nowMs = Date.now()) {
  const parsed = typeof value === "string" ? JSON.parse(value) : value;
  const handoff = assertRecord(parsed, "The agent image handoff is invalid.");
  if (
    handoff.kind !== AGENT_IMAGE_HANDOFF_KIND ||
    handoff.version !== 1 ||
    handoff.bucket !== "media" ||
    typeof handoff.requestId !== "string" ||
    !UUID_PATTERN.test(handoff.requestId)
  ) {
    throw new Error("The agent image handoff format is unsupported.");
  }
  const projectUrl = normalizeProjectUrl(handoff.projectUrl);
  const createdAt = normalizeTimestamp(handoff.createdAt, "Handoff timestamp");
  const expiresAt = normalizeTimestamp(handoff.expiresAt, "Handoff expiry");
  const createdAtMs = Date.parse(createdAt);
  const expiresAtMs = Date.parse(expiresAt);
  if (createdAtMs > nowMs + 5 * 60 * 1000 || expiresAtMs <= createdAtMs) {
    throw new Error("The agent image handoff timestamps are invalid.");
  }
  if (expiresAtMs > createdAtMs + HANDOFF_LIFETIME_MS + 1000) {
    throw new Error("The agent image handoff lasts longer than allowed.");
  }
  if (nowMs >= expiresAtMs) {
    throw new Error(
      "The agent image handoff expired. Ask the admin to approve it again.",
    );
  }
  if (
    !Array.isArray(handoff.files) ||
    handoff.files.length < 1 ||
    handoff.files.length > MAX_AGENT_IMAGE_FILES
  ) {
    throw new Error("The agent image handoff has an invalid file list.");
  }

  const files = handoff.files.map((value) => {
    const entry = assertRecord(
      value,
      "An agent image handoff entry is invalid.",
    );
    const file = normalizeFile(entry);
    if (typeof entry.objectPath !== "string") {
      throw new Error("An agent image object path is missing.");
    }
    const expectedSuffix = buildAgentImageObjectPath(
      "placeholder",
      handoff.requestId,
      file,
    ).replace("posts/placeholder/", "");
    if (!entry.objectPath.match(/^posts\/[a-z0-9]+(?:-[a-z0-9]+)*\//)) {
      throw new Error("An agent image object path is outside a post folder.");
    }
    if (
      entry.objectPath.replace(/^posts\/[a-z0-9-]+\//, "") !== expectedSuffix
    ) {
      throw new Error(
        "An agent image object path does not match its approved file.",
      );
    }
    const publicUrl = publicUrlFor(projectUrl, entry.objectPath);
    if (entry.publicUrl !== publicUrl) {
      throw new Error(
        "An agent image public URL does not match its Supabase path.",
      );
    }
    return {
      ...file,
      objectPath: entry.objectPath,
      signedUrl: validateSignedUrl(
        projectUrl,
        entry.objectPath,
        entry.signedUrl,
      ),
      publicUrl,
    };
  });
  if (new Set(files.map((file) => file.id)).size !== files.length) {
    throw new Error("The agent image handoff contains duplicate file ids.");
  }

  return {
    kind: AGENT_IMAGE_HANDOFF_KIND,
    version: 1,
    requestId: handoff.requestId.toLowerCase(),
    projectUrl,
    bucket: "media",
    createdAt,
    expiresAt,
    files,
  };
}
