import { NextResponse } from "next/server";
import { markdownHeaders } from "@/lib/article-markdown";
import { buildLlmsFullTxt } from "@/lib/llms-txt";

export const revalidate = 60;

export async function GET() {
  const body = await buildLlmsFullTxt();

  return new NextResponse(body, { headers: markdownHeaders });
}
