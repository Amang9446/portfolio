import { NextResponse } from "next/server";
import { buildFeedXml, feedHeaders } from "@/lib/feed";

export const revalidate = 60;

export async function GET() {
  const body = await buildFeedXml();

  return new NextResponse(body, { headers: feedHeaders });
}
