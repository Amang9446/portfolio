#!/usr/bin/env node

import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rm, stat, unlink, writeFile } from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import {
  basename,
  dirname,
  extname,
  isAbsolute,
  join,
  relative,
  resolve,
} from "node:path";
import {
  AGENT_IMAGE_REQUEST_KIND,
  MAX_AGENT_IMAGE_BYTES,
  encodeAgentImageRequest,
  parseAgentImageHandoff,
} from "../src/lib/agent-image-handoff.mjs";

const STATE_KIND = "portfolio-agent-image-state";
const STATE_DIRECTORY_PREFIX = "portfolio-agent-image-request-";
const HANDOFF_FILE_PREFIX = "portfolio-agent-image-handoff-";
const PUBLIC_MEDIA_CACHE_SECONDS = "31536000";
const MIME_BY_EXTENSION = new Map([
  [".avif", "image/avif"],
  [".gif", "image/gif"],
  [".jpeg", "image/jpeg"],
  [".jpg", "image/jpeg"],
  [".png", "image/png"],
  [".webp", "image/webp"],
]);

function parseArgs(argv) {
  const [command, ...rest] = argv;
  const options = {};
  const files = [];
  for (let index = 0; index < rest.length; index++) {
    const argument = rest[index];
    if (!argument.startsWith("--")) {
      files.push(argument);
      continue;
    }
    const value = rest[index + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`Missing value for ${argument}.`);
    }
    options[argument.slice(2).replaceAll("-", "_")] = value;
    index++;
  }
  return { command, options, files };
}

function mimeForPath(filePath) {
  return MIME_BY_EXTENSION.get(extname(filePath).toLowerCase()) ?? null;
}

async function sha256(filePath) {
  return createHash("sha256")
    .update(await readFile(filePath))
    .digest("hex");
}

function isOwnedStateDirectory(directory) {
  const child = relative(tmpdir(), directory);
  return (
    child !== "" &&
    !child.startsWith("..") &&
    !isAbsolute(child) &&
    basename(directory).startsWith(STATE_DIRECTORY_PREFIX)
  );
}

function isOwnedHandoffFile(filePath, requestId) {
  return basename(filePath) === `${HANDOFF_FILE_PREFIX}${requestId}.json`;
}

async function writePrivateJson(filePath, value) {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, {
    mode: 0o600,
  });
}

async function request(fileArgs) {
  if (fileArgs.length === 0) throw new Error("Pass at least one image file.");
  const requestId = randomUUID();
  const createdAt = new Date().toISOString();
  const stateFiles = [];

  for (const argument of fileArgs) {
    const sourcePath = resolve(argument);
    const fileStat = await stat(sourcePath);
    const contentType = mimeForPath(sourcePath);
    if (!fileStat.isFile()) throw new Error(`${argument} is not a file.`);
    if (!contentType) {
      throw new Error(
        `${argument} must be an AVIF, GIF, JPEG, PNG, or WebP image.`,
      );
    }
    if (fileStat.size < 1 || fileStat.size > MAX_AGENT_IMAGE_BYTES) {
      throw new Error(`${argument} must be between 1 byte and 10 MiB.`);
    }
    stateFiles.push({
      id: randomUUID(),
      name: basename(sourcePath),
      sourcePath,
      contentType,
      size: fileStat.size,
      sha256: await sha256(sourcePath),
    });
  }

  const publicRequest = {
    kind: AGENT_IMAGE_REQUEST_KIND,
    version: 1,
    requestId,
    createdAt,
    files: stateFiles.map(({ id, name, contentType, size, sha256 }) => ({
      id,
      name,
      contentType,
      size,
      sha256,
    })),
  };
  const requestCode = encodeAgentImageRequest(publicRequest);
  const directory = join(tmpdir(), `${STATE_DIRECTORY_PREFIX}${requestId}`);
  await mkdir(directory, { mode: 0o700 });
  const statePath = join(directory, "state.json");
  const expectedHandoffPath = join(
    homedir(),
    "Downloads",
    `${HANDOFF_FILE_PREFIX}${requestId}.json`,
  );
  await writePrivateJson(statePath, {
    kind: STATE_KIND,
    version: 1,
    requestId,
    createdAt,
    requestCode,
    files: stateFiles,
    completed: {},
  });

  process.stdout.write(
    [
      `Prepared a request for ${stateFiles.length} exact image${stateFiles.length === 1 ? "" : "s"}.`,
      `Private state: ${statePath}`,
      "",
      "Paste this non-secret request into the draft's “Agent image upload” panel:",
      requestCode,
      "",
      "After the admin approves and downloads the handoff, run:",
      `node scripts/draft-image-upload.mjs upload --state ${JSON.stringify(statePath)} --handoff ${JSON.stringify(expectedHandoffPath)}`,
      "",
    ].join("\n"),
  );
}

function validateState(state, handoff) {
  if (
    !state ||
    state.kind !== STATE_KIND ||
    state.version !== 1 ||
    state.requestId !== handoff.requestId ||
    !Array.isArray(state.files) ||
    !state.completed ||
    typeof state.completed !== "object"
  ) {
    throw new Error("The private request state does not match this handoff.");
  }
  const handoffById = new Map(handoff.files.map((file) => [file.id, file]));
  if (handoffById.size !== state.files.length) {
    throw new Error("The handoff does not contain every requested file.");
  }
  for (const file of state.files) {
    const approved = handoffById.get(file.id);
    if (
      !approved ||
      approved.name !== file.name ||
      approved.contentType !== file.contentType ||
      approved.size !== file.size ||
      approved.sha256 !== file.sha256
    ) {
      throw new Error(`The handoff does not match ${file.name}.`);
    }
  }
}

async function preflightPendingFiles(state, handoff) {
  const byId = new Map(state.files.map((file) => [file.id, file]));
  const bodies = new Map();
  for (const approved of handoff.files) {
    if (state.completed[approved.id]) continue;
    const local = byId.get(approved.id);
    const fileStat = await stat(local.sourcePath);
    const body = await readFile(local.sourcePath);
    if (
      !fileStat.isFile() ||
      fileStat.size !== approved.size ||
      mimeForPath(local.sourcePath) !== approved.contentType ||
      createHash("sha256").update(body).digest("hex") !== approved.sha256
    ) {
      throw new Error(
        `${local.sourcePath} changed after approval. Create a new request instead of uploading it.`,
      );
    }
    bodies.set(approved.id, body);
  }
  return bodies;
}

async function upload(options) {
  if (!options.state) throw new Error("Pass --state <private-state.json>.");
  if (!options.handoff) {
    throw new Error("Pass --handoff <downloaded-handoff.json>.");
  }
  const statePath = resolve(options.state);
  const handoffPath = resolve(options.handoff);
  const stateDirectory = dirname(statePath);
  if (
    basename(statePath) !== "state.json" ||
    !isOwnedStateDirectory(stateDirectory)
  ) {
    throw new Error(
      "The private request state is outside its safe temporary directory.",
    );
  }
  const state = JSON.parse(await readFile(statePath, "utf8"));
  const handoff = parseAgentImageHandoff(await readFile(handoffPath, "utf8"));
  validateState(state, handoff);
  const pendingBodies = await preflightPendingFiles(state, handoff);

  const localById = new Map(state.files.map((file) => [file.id, file]));
  for (const approved of handoff.files) {
    if (state.completed[approved.id]) continue;
    const response = await fetch(approved.signedUrl, {
      method: "PUT",
      headers: {
        "cache-control": `max-age=${PUBLIC_MEDIA_CACHE_SECONDS}`,
        "content-type": approved.contentType,
        "x-upsert": "false",
      },
      body: pendingBodies.get(approved.id),
    });
    if (!response.ok) {
      const message = await response.text().catch(() => "");
      const completedCount = Object.keys(state.completed).length;
      throw new Error(
        `${approved.name} failed (${response.status}): ${message || response.statusText}. ` +
          `${completedCount} completed upload${completedCount === 1 ? " is" : "s are"} recorded; rerun the same command to resume.`,
      );
    }
    state.completed[approved.id] = {
      uploadedAt: new Date().toISOString(),
      publicUrl: approved.publicUrl,
    };
    await writePrivateJson(statePath, state);
    process.stdout.write(
      `Uploaded ${approved.name} -> ${approved.publicUrl}\n`,
    );
  }

  const uploaded = handoff.files.map((file) => ({
    file: localById.get(file.id).sourcePath,
    path: file.objectPath,
    publicUrl: file.publicUrl,
  }));
  process.stdout.write(`${JSON.stringify({ uploaded }, null, 2)}\n`);

  await rm(stateDirectory, { recursive: true, force: true });
  if (isOwnedHandoffFile(handoffPath, handoff.requestId)) {
    await unlink(handoffPath).catch(() => undefined);
  } else {
    process.stderr.write(
      `Upload handoff left at ${handoffPath}; delete it because it contains temporary credentials.\n`,
    );
  }
}

async function discard(options) {
  if (!options.state) throw new Error("Pass --state <private-state.json>.");
  const statePath = resolve(options.state);
  const stateDirectory = dirname(statePath);
  if (
    basename(statePath) !== "state.json" ||
    !isOwnedStateDirectory(stateDirectory)
  ) {
    throw new Error("Refusing to remove an unexpected state directory.");
  }
  const state = JSON.parse(await readFile(statePath, "utf8"));
  if (
    state.kind !== STATE_KIND ||
    state.version !== 1 ||
    typeof state.requestId !== "string"
  ) {
    throw new Error("Refusing to remove an invalid private request state.");
  }
  let handoffPath = null;
  if (options.handoff) {
    handoffPath = resolve(options.handoff);
    if (!isOwnedHandoffFile(handoffPath, state.requestId)) {
      throw new Error("Refusing to remove an unexpected handoff file.");
    }
  }
  await rm(stateDirectory, { recursive: true, force: true });
  if (handoffPath) await unlink(handoffPath).catch(() => undefined);
  process.stdout.write(
    "Discarded the local image request state. Any issued slots will expire automatically.\n",
  );
}

function usage() {
  return `Usage:
  node scripts/draft-image-upload.mjs request <image...>
  node scripts/draft-image-upload.mjs upload --state <private-state.json> --handoff <downloaded-handoff.json>
  node scripts/draft-image-upload.mjs discard --state <private-state.json> [--handoff <downloaded-handoff.json>]
`;
}

async function main() {
  const { command, options, files } = parseArgs(process.argv.slice(2));
  if (command === "request") return request(files);
  if (command === "upload") return upload(options);
  if (command === "discard") return discard(options);
  throw new Error(usage());
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : error}\n`);
  process.exitCode = 1;
});
