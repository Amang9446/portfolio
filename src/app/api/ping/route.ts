import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

// Hit daily by Vercel Cron (see vercel.json). The lightweight query counts
// as database activity, which keeps the free-tier Supabase project from
// being auto-paused after a week of inactivity.
export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: false, reason: "unconfigured" });
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("posts")
    .select("id", { head: true, count: "exact" });

  return NextResponse.json({ ok: !error, at: new Date().toISOString() });
}
