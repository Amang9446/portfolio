import { NextResponse } from "next/server";
import { markdownHeaders } from "@/lib/article-markdown";
import { buildLlmsTxt } from "@/lib/llms-txt";

export const revalidate = 60;

export async function GET() {
  const body = await buildLlmsTxt();

  return new NextResponse(body, { headers: markdownHeaders });
}
