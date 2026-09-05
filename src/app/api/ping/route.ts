import { NextResponse } from "next/server";
import { createPublicClient } from "@/lib/supabase/public";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

// Hit daily by Vercel Cron (see vercel.json). The lightweight query counts
// as database activity, which keeps the free-tier Supabase project from
// being auto-paused after a week of inactivity.
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { ok: false, reason: "unauthorized" },
        { status: 401 },
      );
    }
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: false, reason: "unconfigured" });
  }

  const supabase = createPublicClient();
  const { error } = await supabase
    .from("posts")
    .select("id", { head: true, count: "exact" });

  return NextResponse.json({ ok: !error, at: new Date().toISOString() });
}
