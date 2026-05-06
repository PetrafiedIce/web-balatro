import { NextRequest, NextResponse } from "next/server";

import { modRegistry } from "@/lib/mod-registry";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  const allowed = modRegistry.some((entry) => entry.downloadUrl === url);

  if (!allowed) {
    return NextResponse.json({ error: "Unknown mod archive" }, { status: 403 });
  }

  const response = await fetch(url);

  if (!response.ok || !response.body) {
    return NextResponse.json({ error: "Could not fetch mod archive" }, { status: response.status || 502 });
  }

  return new NextResponse(response.body, {
    headers: {
      "Content-Type": response.headers.get("Content-Type") ?? "application/zip",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
