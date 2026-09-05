"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  buildAgentImageHandoff,
  buildAgentImageObjectPath,
  parseAgentImageRequest,
} from "@/lib/agent-image-handoff.mjs";
import { createClient } from "@/lib/supabase/client";
import { supabaseUrl } from "@/lib/supabase/config";

interface AgentImageHandoffProps {
  slug: string;
}

const requestClass =
  "min-h-24 w-full resize-y rounded-md border border-input bg-background p-3 font-mono text-xs text-foreground outline-none transition-colors focus:border-ring";

function downloadHandoff(handoff: unknown, requestId: string) {
  const blob = new Blob([`${JSON.stringify(handoff, null, 2)}\n`], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `portfolio-agent-image-handoff-${requestId}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export default function AgentImageHandoff({ slug }: AgentImageHandoffProps) {
  const [requestCode, setRequestCode] = useState("");
  const [issuing, setIssuing] = useState(false);
  const [handoff, setHandoff] = useState<ReturnType<
    typeof buildAgentImageHandoff
  > | null>(null);

  const request = useMemo(() => {
    if (!requestCode.trim()) return { data: null, error: "" };
    try {
      return { data: parseAgentImageRequest(requestCode), error: "" };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : "Invalid request code.",
      };
    }
  }, [requestCode]);

  const approve = async () => {
    if (!request.data) {
      toast.error(request.error || "Paste an agent upload request first.");
      return;
    }
    setIssuing(true);
    try {
      const supabase = createClient();
      const slots = await Promise.all(
        request.data.files.map(async (file) => {
          const objectPath = buildAgentImageObjectPath(
            slug,
            request.data!.requestId,
            file,
          );
          const { data, error } = await supabase.storage
            .from("media")
            .createSignedUploadUrl(objectPath, { upsert: false });
          if (error || !data) {
            throw new Error(
              `Could not approve \"${file.name}\": ${error?.message ?? "Supabase returned no upload slot"}`,
            );
          }
          return {
            fileId: file.id,
            objectPath,
            signedUrl: data.signedUrl,
          };
        }),
      );
      const nextHandoff = buildAgentImageHandoff(
        requestCode,
        supabaseUrl,
        slots,
      );
      setHandoff(nextHandoff);
      downloadHandoff(nextHandoff, nextHandoff.requestId);
      toast.success(
        "Exact-path upload handoff downloaded. It expires in under two hours.",
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not create the upload handoff.",
      );
    } finally {
      setIssuing(false);
    }
  };

  return (
    <details className="mt-6 rounded-md border border-border">
      <summary className="cursor-pointer px-4 py-3 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground">
        Agent image upload
      </summary>
      <div className="border-t border-border p-4">
        <p className="text-sm text-foreground">
          Paste the request Codex gives you, review every file, then approve the
          batch. This does not share your login or let the agent edit the
          article.
        </p>
        <textarea
          value={requestCode}
          onChange={(event) => {
            setRequestCode(event.target.value);
            setHandoff(null);
          }}
          placeholder="portfolio-image-request:v1:…"
          aria-label="Agent image upload request"
          className={`${requestClass} mt-3`}
        />

        {request.error && (
          <p className="mt-2 text-xs text-destructive">{request.error}</p>
        )}
        {request.data && (
          <div className="mt-3 rounded-md bg-secondary/40 p-3">
            <p className="text-xs font-medium text-foreground">
              Approving {request.data.files.length} exact file
              {request.data.files.length === 1 ? "" : "s"}
            </p>
            <ul className="mt-2 space-y-1 font-mono text-xs text-muted-foreground">
              {request.data.files.map((file) => (
                <li key={file.id}>
                  {file.name} · {(file.size / 1024).toFixed(1)} KiB ·{" "}
                  {file.contentType}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={issuing || !request.data}
            onClick={approve}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {issuing ? "Approving…" : "Approve exact files"}
          </button>
          {handoff && (
            <button
              type="button"
              onClick={() => downloadHandoff(handoff, handoff.requestId)}
              className="rounded-md border border-border px-4 py-2 text-sm text-foreground transition-colors hover:bg-secondary"
            >
              Download handoff again
            </button>
          )}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          The downloaded file is a temporary credential for only these new
          Storage paths. Send it only to the agent that made this request; it
          cannot overwrite existing images and expires automatically.
        </p>
      </div>
    </details>
  );
}
